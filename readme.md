<p align="center">
  <img src="https://img.shields.io/badge/ARIA-Decision%20Intelligence-6366f1?style=for-the-badge&logo=brain&logoColor=white" alt="ARIA Badge" />
</p>

<h1 align="center">ARIA — Autonomous Real-time Intelligence Agent</h1>

<p align="center">
  An AI-powered decision intelligence platform built for Indian SMB retailers.<br/>
  Upload data → get instant analytics, forecasts, anomaly detection, and AI-driven strategy — all in one place.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10-3776AB?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.2-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/PyTorch-2.6-EE4C2C?logo=pytorch&logoColor=white" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [ML Pipeline](#-ml-pipeline)
- [AI Fallback Chain](#-ai-fallback-chain)
- [Frontend Pages](#-frontend-pages)
- [Use Cases](#-use-cases)
- [Workflow](#-workflow)
- [Screenshots](#-screenshots)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🧠 Overview

**ARIA** (Autonomous Real-time Intelligence Agent) is a full-stack decision intelligence platform designed specifically for **Indian small and medium business owners** — particularly retail, grocery, restaurant, and service businesses in Tamil Nadu.

Instead of expensive BI tools or complex dashboards, ARIA lets a shop owner:

1. **Log daily sales, expenses, and customer data** in a simple form
2. **Upload CSV/Excel datasets** for deep analysis
3. **Get AI-powered strategy recommendations** personalised to their business type, region, and data patterns
4. **View premium month-end analysis** powered by a custom fine-tuned LLM

The platform combines **classical statistical analysis** (trends, seasonality, forecasting, anomaly detection) with **multi-provider AI reasoning** (Gemini, Groq, Claude) and a **custom QLoRA-fine-tuned TinyLlama model** for premium offline analysis.

---

## ✨ Key Features

| Feature                           | Description                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| 📊 **Smart Data Upload**          | Drag-and-drop CSV/Excel files with auto schema detection, type inference, and data quality scoring |
| 📝 **Daily Business Logs**        | Simple form to log daily revenue, customers, orders, expenses, stock — stored in Firestore         |
| 📈 **6-Layer Analytics Pipeline** | KPIs → Trends → Forecasts → Anomalies → Correlations → AI Insights — all computed server-side      |
| 🔮 **Predictive Intelligence**    | Linear/polynomial regression forecasting with uncertainty bands and confidence intervals           |
| 🚨 **Anomaly Detection**          | Z-score and IQR-based anomaly detection across all numeric features                                |
| 🤖 **AI Strategy Advisor**        | Personalised business recommendations powered by Gemini → Groq → Claude fallback chain             |
| 👑 **Premium Month-End Analysis** | Deep analysis powered by ARIA's custom fine-tuned TinyLlama model (one per month per user)         |
| 📄 **PDF Report Generation**      | One-click downloadable professional PDF reports with charts and insights                           |
| 📦 **Stock Management**           | Track inventory, pending items, and stock movements with analytics                                 |
| 🔗 **Integrations**               | Webhook endpoints for external platform sync (POS, accounting, etc.)                               |
| 🔒 **Firebase Auth**              | Email/password authentication with user profiles stored in Firestore                               |

---

## 🏗 Architecture

ARIA uses a **6-layer analytics pipeline** architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19)                     │
│  Dashboard │ Upload │ Daily Log │ Strategy │ Premium │ Stock │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / REST API
┌──────────────────────────▼──────────────────────────────────┐
│                   BACKEND (FastAPI)                          │
│                                                             │
│  Layer 1 ─ Data Ingestion        CSV/Excel parse, clean     │
│  Layer 2 ─ Schema Intelligence   Type inference, profiling  │
│  Layer 3 ─ Analytics Engine      KPIs, trends, seasonality  │
│  Layer 4 ─ Predictive Engine     Forecasting, anomalies     │
│  Layer 5 ─ Decision Engine       Correlations, risk scores  │
│  Layer 6 ─ Insight Engine        AI reasoning, narratives   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         AI Client (Multi-Provider Fallback)         │    │
│  │   Gemini 2.0 Flash → Groq Kimi-K2 → Claude Sonnet  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Custom ML Model (QLoRA Fine-Tuned)          │    │
│  │   TinyLlama 1.1B → LoRA Adapter → Premium Engine   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
      ┌──────────┐  ┌───────────┐  ┌───────────┐
      │ Firebase │  │ Firestore │  │ Local FS  │
      │   Auth   │  │    DB     │  │ Sessions  │
      └──────────┘  └───────────┘  └───────────┘
```

---

## 🛠 Tech Stack

### Backend

| Technology             | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| **Python 3.10**        | Core runtime                                                 |
| **FastAPI 0.115**      | REST API framework with async support                        |
| **Uvicorn**            | ASGI server with hot-reload                                  |
| **Pandas 2.2**         | Data manipulation, cleaning, analysis                        |
| **NumPy 1.26**         | Numerical computing                                          |
| **scikit-learn 1.5**   | ML models — Random Forest, Linear Regression, StandardScaler |
| **SciPy 1.14**         | Statistical methods — Pearson correlation, Z-scores          |
| **statsmodels 0.14**   | Time-series analysis, seasonality decomposition              |
| **ReportLab 4.2**      | PDF report generation with tables and styling                |
| **Firebase Admin 6.6** | Server-side Firebase Auth token verification                 |
| **python-dotenv**      | Environment variable management                              |

### AI Providers

| Provider              | Model                         | Role                     |
| --------------------- | ----------------------------- | ------------------------ |
| **Google Gemini**     | `gemini-2.0-flash`            | Primary AI provider      |
| **Groq**              | `moonshotai/kimi-k2-instruct` | First fallback           |
| **Anthropic Claude**  | `claude-sonnet-4-20250514`    | Second fallback          |
| **ARIA Custom Model** | `TinyLlama-1.1B + QLoRA`      | Premium offline analysis |

### ML / Fine-Tuning

| Technology                  | Purpose                                      |
| --------------------------- | -------------------------------------------- |
| **PyTorch 2.6 (CUDA 12.4)** | Training framework                           |
| **Transformers 5.3**        | Model loading, tokenisation                  |
| **PEFT 0.18**               | QLoRA / LoRA parameter-efficient fine-tuning |
| **TRL 0.29**                | `SFTTrainer` for supervised fine-tuning      |
| **bitsandbytes 0.49**       | 4-bit NF4 quantisation for low-VRAM training |
| **Accelerate 1.13**         | Mixed-precision training, device management  |
| **Datasets 4.6**            | Efficient data loading for training          |

### Frontend

| Technology            | Purpose                        |
| --------------------- | ------------------------------ |
| **React 19**          | UI framework                   |
| **Vite 7.3**          | Build tool with HMR            |
| **Tailwind CSS 4.2**  | Utility-first styling          |
| **React Router 7.13** | Client-side routing            |
| **Recharts 3.7**      | Charts and data visualisation  |
| **Lucide React**      | Icon library                   |
| **Axios**             | HTTP client for API calls      |
| **Firebase 12.9**     | Client-side auth and Firestore |
| **PapaParse**         | CSV parsing on the client      |
| **jsPDF + AutoTable** | Client-side PDF generation     |
| **SheetJS (xlsx)**    | Excel file handling            |

### Infrastructure

| Technology                  | Purpose                                         |
| --------------------------- | ----------------------------------------------- |
| **Firebase Authentication** | Email/password sign-in                          |
| **Cloud Firestore**         | User profiles, daily logs, stock data           |
| **Local File System**       | Session persistence (pickle), uploaded datasets |

---

## 📁 Project Structure

```
decision-system/
├── readme.md                          # This file
├── .gitignore
│
├── backend/                           # FastAPI backend
│   ├── main.py                        # API server — all endpoints (1364 lines)
│   ├── requirements.txt               # Python dependencies
│   ├── .env                           # API keys (gitignored)
│   │
│   ├── engine/                        # 6-layer analytics engine
│   │   ├── ai_client.py              # Multi-provider AI fallback (Gemini → Groq → Claude)
│   │   ├── data_ingestion.py         # Layer 1: CSV/Excel parsing, cleaning
│   │   ├── schema_intelligence.py    # Layer 2: Auto type detection, profiling
│   │   ├── analytics_engine.py       # Layer 3: KPIs, trends, seasonality
│   │   ├── predictive_engine.py      # Layer 4: Forecasting, anomaly detection
│   │   ├── decision_engine.py        # Layer 5: Correlations, risk scoring
│   │   ├── insight_engine.py         # Layer 6: AI reasoning, narratives
│   │   └── report_generator.py       # PDF report builder (ReportLab)
│   │
│   ├── ml/                            # Custom model training pipeline
│   │   ├── prepare_dataset.py        # Dataset preparation from 10+ sources
│   │   ├── train.py                  # QLoRA fine-tuning pipeline
│   │   ├── inference.py              # Premium analysis inference engine
│   │   ├── data/                     # Training data (aria_training.jsonl)
│   │   └── checkpoints/             # Saved model weights (gitignored)
│   │
│   └── datasets/                      # Raw training datasets (gitignored)
│
└── frontend/                          # React 19 + Vite frontend
    ├── package.json
    ├── vite.config.js
    ├── index.html
    │
    └── src/
        ├── App.jsx                    # Route definitions
        ├── main.jsx                   # React entry point
        ├── firebase.js                # Firebase config
        ├── index.css                  # Global styles + Tailwind
        │
        ├── pages/                     # Page-level components
        │   ├── DashboardPage.jsx     # Main dashboard with KPIs and charts
        │   ├── UploadPage.jsx        # Dataset upload + analysis
        │   ├── AnalysePage.jsx       # Deep analysis view
        │   ├── DailyLogPage.jsx      # Daily business log entry
        │   ├── StockManagementPage.jsx # Inventory tracking
        │   ├── StrategyAdvisorPage.jsx # AI strategy recommendations
        │   ├── PremiumAnalysisPage.jsx # Monthly premium analysis
        │   ├── IntegrationsPage.jsx  # External platform integrations
        │   ├── ProfilePage.jsx       # User profile settings
        │   ├── LoginPage.jsx         # Auth — login
        │   └── RegisterPage.jsx      # Auth — register
        │
        ├── components/                # Reusable UI components
        │   ├── AppLayout.jsx         # Sidebar + content layout shell
        │   ├── Header.jsx            # Top navigation bar
        │   ├── Dashboard.jsx         # Dashboard widget grid
        │   ├── KPICards.jsx          # KPI summary cards
        │   ├── TrendCharts.jsx       # Trend line charts
        │   ├── ForecastPanel.jsx     # Forecast visualisation
        │   ├── AnomalyPanel.jsx      # Anomaly detection alerts
        │   ├── CorrelationView.jsx   # Correlation matrix
        │   ├── InsightPanel.jsx      # AI insight cards
        │   ├── SchemaView.jsx        # Data schema viewer
        │   ├── UploadZone.jsx        # Drag-and-drop upload area
        │   ├── ProcessingView.jsx    # Analysis processing animation
        │   └── ProtectedRoute.jsx    # Auth route guard
        │
        ├── contexts/                  # React contexts
        │   └── AuthContext.jsx       # Firebase auth state
        │
        └── services/                  # API service layer
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- **NVIDIA GPU** (optional, for ML training — 4GB+ VRAM)
- **Firebase project** with Auth + Firestore enabled

### 1. Clone the Repository

```bash
git clone https://github.com/Mithil2305/aria-agent.git
cd aria-agent
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create .env file with your API keys
copy .env.example .env       # Then edit with your keys
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Run the Application

**Terminal 1 — Backend:**

```bash
cd backend
venv\Scripts\activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Environment Variables

Create a `backend/.env` file:

```env
# Google Gemini API Key (primary AI provider)
# Get from: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_key_here

# Groq API Key (first fallback)
# Get from: https://console.groq.com/keys
GROQ_API_KEY=your_groq_key_here

# Anthropic Claude API Key (second fallback)
# Get from: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=your_anthropic_key_here
```

> **Note:** The Firebase config is in `frontend/src/firebase.js`. Replace with your own project credentials.

---

## 📡 API Reference

| Method | Endpoint                               | Description                                   |
| ------ | -------------------------------------- | --------------------------------------------- |
| `GET`  | `/health`                              | Health check                                  |
| `POST` | `/api/upload`                          | Upload CSV/Excel file for analysis            |
| `POST` | `/api/demo`                            | Run analysis on sample demo data              |
| `GET`  | `/api/analyze`                         | Get cached analysis results                   |
| `POST` | `/api/upload-logs`                     | Upload daily business logs from Firestore     |
| `GET`  | `/api/report`                          | Download PDF report                           |
| `POST` | `/api/integrations/webhook/{platform}` | Receive webhook from external platforms       |
| `POST` | `/api/integrations/sync`               | Sync data from integrations                   |
| `POST` | `/api/strategy`                        | Generate AI-powered strategy recommendations  |
| `POST` | `/api/premium-analysis`                | Run premium month-end analysis (1/month/user) |
| `GET`  | `/api/premium-analysis/status`         | Check premium analysis availability           |

All protected endpoints require a Firebase Auth `Bearer` token in the `Authorization` header.

---

## 🤖 ML Pipeline

ARIA includes a complete custom model training pipeline:

### Dataset Preparation

The `prepare_dataset.py` script processes **10+ diverse datasets** into a unified instruction-tuning format:

| Dataset         | Type                                  | Samples |
| --------------- | ------------------------------------- | ------- |
| Rossmann Stores | Retail sales forecasting              | ~8,000  |
| BigMart Sales   | Item-level prediction                 | ~4,000  |
| M5 Forecasting  | Walmart time-series                   | ~5,000  |
| FinQA           | Financial QA with numerical reasoning | ~3,000  |
| GSM8K           | Math reasoning (chain-of-thought)     | ~4,000  |
| Orca-Math 200K  | Math word problems                    | ~4,000  |
| OpenOrca        | General instruction following         | ~2,000  |
| TabFact         | Table fact verification               | ~3,000  |
| NAB Anomaly     | Time-series anomaly detection         | ~2,000  |
| Online Retail   | Transaction-level data                | ~1,000  |

**Total: ~35,800 instruction-tuning samples** saved as `aria_training.jsonl`.

### Training Configuration

```
Base Model:       TinyLlama/TinyLlama-1.1B-Chat-v1.0
Method:           QLoRA (4-bit NF4 quantisation)
LoRA Rank:        16
LoRA Alpha:       32
LoRA Targets:     q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj
Batch Size:       2 (with 8x gradient accumulation → effective 16)
Learning Rate:    2e-4
Epochs:           3
Precision:        BFloat16
Max Seq Length:   1024
```

### Run Training

```bash
cd backend
venv\Scripts\activate
python -m ml.train
```

Requires an NVIDIA GPU with 4GB+ VRAM. Training takes ~24 hours on RTX 3050 Laptop.

### Inference

Once trained, the model auto-loads for premium analysis:

- Weights saved to `backend/ml/checkpoints/aria-model/`
- `inference.py` handles lazy loading, prompt construction, and JSON output parsing
- Falls back to rule-based analysis if the model isn't available

---

## 🔄 AI Fallback Chain

ARIA uses a resilient multi-provider AI strategy:

```
Request comes in
       │
       ▼
┌─────────────┐    success    ┌──────────────┐
│   Gemini    │──────────────►│  Return      │
│  2.0 Flash  │               │  Response    │
└──────┬──────┘               └──────────────┘
       │ failure
       ▼
┌─────────────┐    success    ┌──────────────┐
│    Groq     │──────────────►│  Return      │
│  Kimi K2    │               │  Response    │
└──────┬──────┘               └──────────────┘
       │ failure
       ▼
┌─────────────┐    success    ┌──────────────┐
│   Claude    │──────────────►│  Return      │
│   Sonnet    │               │  Response    │
└──────┬──────┘               └──────────────┘
       │ failure
       ▼
┌─────────────────────────┐
│  Rule-Based Fallback    │
│  (data-driven analysis  │
│   using actual stats)   │
└─────────────────────────┘
```

This ensures **zero downtime** — even if all AI providers hit rate limits, users still get meaningful data-driven recommendations.

---

## 📱 Frontend Pages

| Page                 | Route                 | Description                                                                                                     |
| -------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Dashboard**        | `/`                   | Overview with KPI cards, trend charts, quick stats                                                              |
| **Upload**           | `/upload`             | Drag-and-drop CSV/Excel upload with instant 6-layer analysis                                                    |
| **Analysis**         | `/analyse`            | Deep-dive view with forecasts, anomalies, correlations, insights                                                |
| **Daily Log**        | `/daily-log`          | Form to log daily business metrics (saved to Firestore)                                                         |
| **Stock Management** | `/stock`              | Track inventory, pending items, stock movements                                                                 |
| **Strategy Advisor** | `/strategy`           | AI-generated business strategy with sales tips, customer strategies, purchase suggestions, and a 4-week roadmap |
| **Premium Analysis** | `/premium`            | Monthly deep analysis powered by the custom ARIA model                                                          |
| **Integrations**     | `/integrations`       | Connect external platforms (POS, accounting)                                                                    |
| **Profile**          | `/profile`            | User profile, business type, region settings                                                                    |
| **Login / Register** | `/login`, `/register` | Firebase email/password authentication                                                                          |

---

## 💼 Use Cases

### 🏪 Retail / Grocery Shop Owner

> "I run a provision store in Madurai. I log my daily sales, and ARIA tells me which products to stock more, when to run offers, and warns me if sales are dropping."

- Log daily revenue, customer count, and orders
- Get weekly trend analysis and anomaly alerts
- AI advisor suggests festive season strategies (Pongal, Deepavali)
- Stock management tracks pending deliveries

### 🍽️ Restaurant / Food Business

> "My restaurant's weekend sales are 3x weekdays. ARIA helps me plan staff, ingredients, and marketing accordingly."

- Upload historical sales data (CSV from POS)
- Predictive engine forecasts busy periods with confidence intervals
- Strategy advisor recommends WhatsApp marketing and local event tie-ups
- Monthly premium analysis identifies cost optimisation opportunities

### 🛒 E-commerce / Online Seller

> "I sell on multiple platforms. ARIA analyses my combined data and finds which products and channels are underperforming."

- Upload multi-platform sales CSV
- Correlation engine identifies product-channel performance links
- Feature importance shows what drives revenue
- Risk scoring flags declining categories

### 📊 Business Analyst / Consultant

> "I upload client datasets and generate professional PDF reports in seconds — what used to take hours of Excel work."

- Upload any CSV/Excel dataset
- Auto schema detection works with any data structure
- Full analysis pipeline runs in seconds
- Download branded PDF report with charts and recommendations

---

## 🔄 Workflow

```
                    ┌──────────────────────┐
                    │   User Registration  │
                    │   (Firebase Auth)    │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Upload CSV │  │  Daily Log   │  │  Stock Mgmt  │
    │  /Excel     │  │  Entry       │  │  Entry       │
    └──────┬──────┘  └──────┬───────┘  └──────┬───────┘
           │                │                  │
           ▼                ▼                  │
    ┌──────────────────────────────┐           │
    │   6-Layer Analytics Engine   │           │
    │                              │           │
    │  1. Data Ingestion          │           │
    │  2. Schema Intelligence     │           │
    │  3. KPIs & Trends           │           │
    │  4. Forecasts & Anomalies   │           │
    │  5. Correlations & Risk     │           │
    │  6. AI Insights             │           │
    └──────────┬───────────────────┘           │
               │                               │
       ┌───────┼──────────┬────────────────────┤
       │       │          │                    │
       ▼       ▼          ▼                    ▼
  ┌────────┐ ┌─────┐ ┌──────────┐     ┌──────────────┐
  │Dashboard│ │ PDF │ │ Strategy │     │   Premium    │
  │ Charts │ │Reprt│ │ Advisor  │     │  Analysis    │
  │& KPIs  │ │ DL  │ │(AI-pwrd) │     │(Custom Model)│
  └────────┘ └─────┘ └──────────┘     └──────────────┘
```

### Step-by-Step:

1. **Sign Up** — Create account with email/password (Firebase Auth)
2. **Set Profile** — Choose business type (retail, restaurant, services, etc.), category, and region
3. **Input Data** — Either upload a CSV/Excel file OR log daily metrics through the form
4. **Automatic Analysis** — The 6-layer engine processes your data in seconds
5. **Explore Dashboard** — View KPI cards, trend charts, forecasts, and anomaly alerts
6. **Get Strategy** — Click "Analyse" in Strategy Advisor for AI-powered business recommendations
7. **Premium Report** — Once per month, get a deep analysis powered by the custom ARIA model
8. **Download PDF** — Export a professional report for stakeholders or personal records
9. **Track Over Time** — Daily logs accumulate, making analysis richer over weeks and months

---

## 🗺 Roadmap

- [x] 6-layer analytics pipeline
- [x] Multi-provider AI fallback (Gemini → Groq → Claude)
- [x] Firebase Auth + Firestore integration
- [x] Daily log system with Firestore persistence
- [x] Stock management module
- [x] QLoRA fine-tuning pipeline (TinyLlama 1.1B)
- [x] Premium month-end analysis engine
- [x] PDF report generation
- [ ] WhatsApp Business API integration
- [ ] Multi-language support (Tamil, Hindi)
- [ ] Mobile-responsive PWA
- [ ] Voice input for daily logs
- [ ] Automated daily insights via email/notification
- [ ] Multi-store / multi-branch support
- [ ] Inventory prediction and auto-reorder suggestions

---

## 📄 License

This project is proprietary. All rights reserved.

---

<p align="center">
  Built with ❤️ for Indian small businesses<br/>
  <strong>ARIA</strong> — Making AI-powered business intelligence accessible to everyone.
</p>
