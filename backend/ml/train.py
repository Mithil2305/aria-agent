"""
Yukti — Model Fine-Tuning Pipeline
===================================
Fine-tunes a small LLM (TinyLlama-1.1B or Phi-3-mini) using QLoRA
on the prepared Yukti instruction-tuning dataset.

Usage:
    cd backend
    python -m ml.train

Requirements (install in venv):
    pip install torch transformers peft bitsandbytes accelerate datasets trl

Output:
    backend/ml/checkpoints/yukti-model/   — LoRA adapter weights
"""

import os
import json
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("yukti.train")

MODEL_DIR = Path(__file__).parent / "checkpoints" / "yukti-model"
DATA_FILE = Path(__file__).parent / "data" / "yukti_training.jsonl"

# ── Configuration ──
CONFIG = {
    # Base model — TinyLlama is fast to train and fits in 8GB VRAM
    "base_model": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",

    # LoRA hyperparameters
    "lora_r": 16,
    "lora_alpha": 32,
    "lora_dropout": 0.05,
    "lora_target_modules": ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],

    # Training hyperparameters
    "num_epochs": 3,
    "per_device_batch_size": 2,
    "gradient_accumulation_steps": 8,
    "learning_rate": 2e-4,
    "warmup_ratio": 0.05,
    "max_seq_length": 1024,
    "fp16": False,
    "bf16": True,
    "logging_steps": 50,
    "save_steps": 500,
    "save_total_limit": 2,
}


def format_prompt(sample: dict) -> str:
    """Convert instruction/input/output dict to chat template."""
    instruction = sample.get("instruction", "")
    inp = sample.get("input", "")
    output = sample.get("output", "")

    if inp:
        prompt = (
            f"<|system|>\nYou are Yukti, an expert Indian business analytics AI specializing in "
            f"retail intelligence, financial reasoning, and actionable strategy recommendations "
            f"for small businesses in India.</s>\n"
            f"<|user|>\n{instruction}\n\n{inp}</s>\n"
            f"<|assistant|>\n{output}</s>"
        )
    else:
        prompt = (
            f"<|system|>\nYou are Yukti, an expert Indian business analytics AI.</s>\n"
            f"<|user|>\n{instruction}</s>\n"
            f"<|assistant|>\n{output}</s>"
        )
    return prompt


def load_dataset_from_jsonl(path: Path) -> list[dict]:
    """Load JSONL file into list of dicts."""
    records = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def main():
    log.info("=" * 60)
    log.info("🚀 Yukti Model Training Pipeline")
    log.info("=" * 60)

    # ── Check dependencies ──
    try:
        import torch
        from transformers import (
            AutoModelForCausalLM,
            AutoTokenizer,
            BitsAndBytesConfig,
        )
        from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
        from trl import SFTTrainer, SFTConfig
        from datasets import Dataset
    except ImportError as e:
        log.error("❌ Missing dependency: %s", e)
        log.error("   Install with: pip install torch transformers peft bitsandbytes accelerate datasets trl")
        return

    # ── Check data file ──
    if not DATA_FILE.exists():
        log.error("❌ Training data not found: %s", DATA_FILE)
        log.error("   Run: python -m ml.prepare_dataset")
        return

    log.info("📂 Loading training data from %s", DATA_FILE)
    raw_data = load_dataset_from_jsonl(DATA_FILE)
    log.info("   Total samples: %d", len(raw_data))

    # ── Format prompts ──
    log.info("📝 Formatting prompts…")
    formatted = [{"text": format_prompt(s)} for s in raw_data]
    dataset = Dataset.from_list(formatted)
    log.info("   Dataset ready: %d samples", len(dataset))

    # ── Split train/eval ──
    split = dataset.train_test_split(test_size=0.05, seed=42)
    train_dataset = split["train"]
    eval_dataset = split["test"]
    log.info("   Train: %d, Eval: %d", len(train_dataset), len(eval_dataset))

    # ── Load tokenizer ──
    log.info("🔤 Loading tokenizer: %s", CONFIG["base_model"])
    tokenizer = AutoTokenizer.from_pretrained(CONFIG["base_model"], trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.pad_token_id = tokenizer.eos_token_id

    # ── Quantization config (4-bit for QLoRA) ──
    device = "cuda" if torch.cuda.is_available() else "cpu"
    log.info("🖥️  Device: %s", device)

    if device == "cuda":
        log.info("⚡ Using 4-bit quantization (QLoRA)")
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )
    else:
        log.info("💻 Running on CPU (no quantization, will be slow)")
        bnb_config = None

    # ── Load base model ──
    log.info("🤖 Loading base model: %s", CONFIG["base_model"])
    model_kwargs = {
        "trust_remote_code": True,
        "torch_dtype": torch.float16 if device == "cuda" else torch.float32,
    }
    if bnb_config:
        model_kwargs["quantization_config"] = bnb_config
        model_kwargs["device_map"] = "auto"

    model = AutoModelForCausalLM.from_pretrained(CONFIG["base_model"], **model_kwargs)

    if device == "cuda" and bnb_config:
        model = prepare_model_for_kbit_training(model)

    # ── LoRA config ──
    log.info("🔧 Applying LoRA adapter (r=%d, alpha=%d)", CONFIG["lora_r"], CONFIG["lora_alpha"])
    lora_config = LoraConfig(
        r=CONFIG["lora_r"],
        lora_alpha=CONFIG["lora_alpha"],
        lora_dropout=CONFIG["lora_dropout"],
        target_modules=CONFIG["lora_target_modules"],
        bias="none",
        task_type="CAUSAL_LM",
    )

    model = get_peft_model(model, lora_config)

    # Fix dtype mismatch: ensure NO bfloat16 tensors exist in the model.
    # Cast all trainable params to float32 for stable training.
    for name, param in model.named_parameters():
        if param.requires_grad:
            param.data = param.data.to(torch.float32)

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    log.info("   Trainable params: %s / %s (%.2f%%)", f"{trainable:,}", f"{total:,}", trainable/total*100)

    # ── Training arguments ──
    output_dir = str(MODEL_DIR)
    training_args = SFTConfig(
        output_dir=output_dir,
        max_length=CONFIG["max_seq_length"],
        num_train_epochs=CONFIG["num_epochs"],
        per_device_train_batch_size=CONFIG["per_device_batch_size"],
        gradient_accumulation_steps=CONFIG["gradient_accumulation_steps"],
        learning_rate=CONFIG["learning_rate"],
        warmup_ratio=CONFIG["warmup_ratio"],
        fp16=False,
        bf16=CONFIG["bf16"] and device == "cuda",
        logging_steps=CONFIG["logging_steps"],
        save_steps=CONFIG["save_steps"],
        save_total_limit=CONFIG["save_total_limit"],
        eval_strategy="steps",
        eval_steps=500,
        report_to="none",
        optim="adamw_torch",
        lr_scheduler_type="cosine",
        remove_unused_columns=False,
        dataset_text_field="text",
    )

    # ── Trainer ──
    log.info("🏋️ Starting training…")
    trainer = SFTTrainer(
        model=model,
        processing_class=tokenizer,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        args=training_args,
    )

    # ── Train! ──
    trainer.train()

    # ── Save ──
    log.info("💾 Saving model to %s", output_dir)
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)

    # Save config for inference
    config_path = MODEL_DIR / "yukti_config.json"
    with open(config_path, "w") as f:
        json.dump({
            "base_model": CONFIG["base_model"],
            "lora_r": CONFIG["lora_r"],
            "lora_alpha": CONFIG["lora_alpha"],
            "max_seq_length": CONFIG["max_seq_length"],
            "trained_on": len(raw_data),
            "trained_at": str(Path(DATA_FILE).stat().st_mtime),
        }, f, indent=2)

    log.info("=" * 60)
    log.info("✅ Training complete!")
    log.info("   Model saved to: %s", output_dir)
    log.info("   Config saved to: %s", config_path)
    log.info("=" * 60)


if __name__ == "__main__":
    main()
