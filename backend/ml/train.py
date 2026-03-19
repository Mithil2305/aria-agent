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
import inspect
import time
import warnings
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
    # Keep this as an upper bound; wall-clock callback will stop at target_train_hours.
    "num_epochs": 8,
    "per_device_batch_size": 4,
    "gradient_accumulation_steps": 4,
    "learning_rate": 2e-4,
    "max_seq_length": 384,
    "eval_split": 0.01,
    "min_train_hours": 6,
    "target_train_hours": 8,
    "early_stopping_patience": 2,
    "fp16": False,
    "bf16": True,
    "logging_steps": 200,
    "save_total_limit": 2,

    # Keep disabled by default to avoid network fetches for remote custom code.
    "trust_remote_code": False,
}


def _env_flag(name: str) -> bool:
    """Parse common truthy environment-variable forms."""
    value = os.getenv(name, "").strip().lower()
    return value in {"1", "true", "yes", "on"}


def resolve_hf_local_only() -> bool:
    """Use local HF cache only when any offline flag is enabled."""
    return any(
        _env_flag(var)
        for var in ("YUKTI_HF_OFFLINE", "HF_HUB_OFFLINE", "TRANSFORMERS_OFFLINE")
    )


def resolve_train_hours() -> float:
    """Resolve wall-clock hours, clamped to configured min/max bounds."""
    min_h = float(CONFIG["min_train_hours"])
    max_h = float(CONFIG["target_train_hours"])
    requested_raw = os.getenv("YUKTI_TRAIN_HOURS")

    if requested_raw is None:
        requested = max_h
    else:
        try:
            requested = float(requested_raw)
        except ValueError:
            log.warning("⚠️ Invalid YUKTI_TRAIN_HOURS=%s; using default %.1f hours", requested_raw, max_h)
            requested = max_h

    clamped = max(min_h, min(max_h, requested))
    if requested != clamped:
        log.warning(
            "⚠️ Requested train hours %.3f outside [%.1f, %.1f]; using %.1f hours",
            requested,
            min_h,
            max_h,
            clamped,
        )
    return clamped


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
        from requests import RequestsDependencyWarning
        from transformers import (
            AutoModelForCausalLM,
            AutoTokenizer,
            BitsAndBytesConfig,
            EarlyStoppingCallback,
            TrainerCallback,
        )
        from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
        from trl import SFTTrainer, SFTConfig
        from datasets import Dataset
    except ImportError as e:
        log.error("❌ Missing dependency: %s", e)
        log.error("   Install with: pip install torch transformers peft bitsandbytes accelerate datasets trl")
        return

    # Silence known non-fatal dependency warning from requests/huggingface stack.
    warnings.filterwarnings("ignore", category=RequestsDependencyWarning)

    class WallClockLimitCallback(TrainerCallback):
        """Stop training cleanly once a wall-clock budget is reached."""

        def __init__(self, max_hours: float):
            self.max_seconds = max_hours * 3600
            self.start_time = None

        def on_train_begin(self, args, state, control, **kwargs):
            self.start_time = time.time()
            return control

        def on_step_end(self, args, state, control, **kwargs):
            if self.start_time is None:
                return control

            elapsed = time.time() - self.start_time
            if elapsed >= self.max_seconds:
                control.should_training_stop = True
            return control

    class MinTrainDurationCallback(TrainerCallback):
        """Prevent early-stopping or other callbacks from ending before min duration."""

        def __init__(self, min_hours: float):
            self.min_seconds = min_hours * 3600
            self.start_time = None

        def on_train_begin(self, args, state, control, **kwargs):
            self.start_time = time.time()
            return control

        def _enforce_min_duration(self, control):
            if self.start_time is None:
                return control
            if (time.time() - self.start_time) < self.min_seconds:
                control.should_training_stop = False
            return control

        def on_step_end(self, args, state, control, **kwargs):
            return self._enforce_min_duration(control)

        def on_evaluate(self, args, state, control, **kwargs):
            return self._enforce_min_duration(control)

    # Enable TensorFloat32 kernels on supported NVIDIA GPUs for faster matmul.
    if torch.cuda.is_available():
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
        torch.set_float32_matmul_precision("high")

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

    if len(dataset) < 2:
        log.error("❌ Need at least 2 samples for train/eval split. Found: %d", len(dataset))
        return

    # ── Load tokenizer ──
    log.info("🔤 Loading tokenizer: %s", CONFIG["base_model"])
    hf_local_only = resolve_hf_local_only()
    if hf_local_only:
        log.info("📦 Hugging Face offline mode enabled (local cache only)")

    tokenizer = AutoTokenizer.from_pretrained(
        CONFIG["base_model"],
        trust_remote_code=bool(CONFIG.get("trust_remote_code", False)),
        local_files_only=hf_local_only,
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.pad_token_id = tokenizer.eos_token_id

    # Pre-truncate texts to avoid sequence overflow regardless of TRL version behavior.
    tokenizer_max = getattr(tokenizer, "model_max_length", CONFIG["max_seq_length"])
    if tokenizer_max is None or tokenizer_max > 100000:
        tokenizer_max = CONFIG["max_seq_length"]
    effective_max_len = min(int(tokenizer_max), int(CONFIG["max_seq_length"]))

    def _truncate_sample(sample: dict) -> dict:
        ids = tokenizer(
            sample["text"],
            add_special_tokens=False,
            truncation=True,
            max_length=effective_max_len,
        )["input_ids"]
        sample["text"] = tokenizer.decode(ids, skip_special_tokens=False)
        return sample

    log.info("✂️ Truncating samples to max %d tokens", effective_max_len)
    dataset = dataset.map(_truncate_sample, desc="Truncating long samples")

    # ── Split train/eval ──
    eval_size = max(1, int(len(dataset) * CONFIG["eval_split"]))
    split = dataset.train_test_split(test_size=eval_size, seed=42)
    train_dataset = split["train"]
    eval_dataset = split["test"]
    log.info("   Train: %d, Eval: %d", len(train_dataset), len(eval_dataset))

    # ── Quantization config (4-bit for QLoRA) ──
    device = "cuda" if torch.cuda.is_available() else "cpu"
    log.info("🖥️  Device: %s", device)

    if device == "cuda":
        log.info("⚡ Using 4-bit quantization (QLoRA)")
        # Match 4-bit compute dtype with active mixed precision mode for faster kernels.
        bnb_compute_dtype = torch.bfloat16 if CONFIG["bf16"] and getattr(torch.cuda, "is_bf16_supported", lambda: False)() else torch.float16
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=bnb_compute_dtype,
            bnb_4bit_use_double_quant=True,
        )
    else:
        log.info("💻 Running on CPU (no quantization, will be slow)")
        bnb_config = None

    # ── Load base model ──
    log.info("🤖 Loading base model: %s", CONFIG["base_model"])
    model_kwargs = {
        "trust_remote_code": bool(CONFIG.get("trust_remote_code", False)),
        "local_files_only": hf_local_only,
        "dtype": torch.float16 if device == "cuda" else torch.float32,
    }

    supports_flash_attn = False
    if bnb_config:
        model_kwargs["quantization_config"] = bnb_config
        model_kwargs["device_map"] = "auto"
        # Prefer flash attention when available; fall back to SDPA otherwise.
        try:
            import flash_attn  # noqa: F401
            supports_flash_attn = True
        except ImportError:
            supports_flash_attn = False
        model_kwargs["attn_implementation"] = "flash_attention_2" if supports_flash_attn else "sdpa"

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

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    log.info("   Trainable params: %s / %s (%.2f%%)", f"{trainable:,}", f"{total:,}", trainable/total*100)

    # ── Training arguments ──
    output_dir = str(MODEL_DIR)
    use_packing = supports_flash_attn
    if not use_packing:
        log.warning("⚠️ FlashAttention not available; disabling packing for correctness and stable training.")

    desired_sft_kwargs = {
        "output_dir": output_dir,
        "max_seq_length": CONFIG["max_seq_length"],
        "max_length": CONFIG["max_seq_length"],
        "num_train_epochs": CONFIG["num_epochs"],
        "per_device_train_batch_size": CONFIG["per_device_batch_size"],
        "gradient_accumulation_steps": CONFIG["gradient_accumulation_steps"],
        "learning_rate": CONFIG["learning_rate"],
        "warmup_steps": 100,
        "fp16": (not (CONFIG["bf16"] and device == "cuda" and getattr(torch.cuda, "is_bf16_supported", lambda: False)())) and device == "cuda",
        "bf16": CONFIG["bf16"] and device == "cuda" and getattr(torch.cuda, "is_bf16_supported", lambda: False)(),
        "logging_steps": CONFIG["logging_steps"],
        "save_strategy": "epoch",
        "save_total_limit": CONFIG["save_total_limit"],
        "eval_strategy": "epoch",
        "report_to": "none",
        "optim": "paged_adamw_8bit" if device == "cuda" else "adamw_torch",
        "lr_scheduler_type": "cosine",
        "remove_unused_columns": False,
        "dataset_text_field": "text",
        "dataloader_num_workers": 4,
        "group_by_length": True,
        "packing": use_packing,
        "load_best_model_at_end": True,
        "metric_for_best_model": "eval_loss",
        "greater_is_better": False,
    }
    sft_supported = set(inspect.signature(SFTConfig.__init__).parameters)
    sft_kwargs = {k: v for k, v in desired_sft_kwargs.items() if k in sft_supported}
    dropped_sft = sorted(set(desired_sft_kwargs) - set(sft_kwargs))
    if dropped_sft:
        log.warning("⚠️ SFTConfig args not supported by installed TRL; skipping: %s", ", ".join(dropped_sft))

    training_args = SFTConfig(**sft_kwargs)

    # ── Trainer ──
    log.info("🏋️ Starting training…")
    train_hours = resolve_train_hours()
    log.info("⏱️ Training wall-clock budget: %.1f hours (min %.1f, max %.1f)", train_hours, CONFIG["min_train_hours"], CONFIG["target_train_hours"])
    desired_trainer_kwargs = {
        "model": model,
        "processing_class": tokenizer,
        "tokenizer": tokenizer,
        "train_dataset": train_dataset,
        "eval_dataset": eval_dataset,
        "args": training_args,
        "callbacks": [
            EarlyStoppingCallback(early_stopping_patience=CONFIG["early_stopping_patience"]),
            MinTrainDurationCallback(min_hours=float(CONFIG["min_train_hours"])),
            WallClockLimitCallback(max_hours=train_hours),
        ],
    }
    trainer_supported = set(inspect.signature(SFTTrainer.__init__).parameters)
    trainer_kwargs = {}
    for k, v in desired_trainer_kwargs.items():
        if k in trainer_supported:
            trainer_kwargs[k] = v

    # Avoid passing both names in TRL versions that still use tokenizer only.
    if "processing_class" in trainer_kwargs and "tokenizer" in trainer_kwargs:
        trainer_kwargs.pop("tokenizer", None)

    dropped_trainer = sorted(set(desired_trainer_kwargs) - set(trainer_kwargs))
    if dropped_trainer:
        log.warning("⚠️ SFTTrainer args not supported by installed TRL; skipping: %s", ", ".join(dropped_trainer))

    trainer = SFTTrainer(**trainer_kwargs)

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
