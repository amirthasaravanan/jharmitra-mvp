# JanSahyog — SIH 2026 MVP

A runnable MVP for the Smart India Hackathon problem statement:
**A digital platform to crowdsource societal challenges and facilitate collaborative problem solving through universities and industry partnerships.**

## Features

- Role-based login: Citizen, University, Industry, Government
- Citizen problem submission
- Automatic domain categorization using a local ML-style keyword classifier
- Duplicate detection using TF-IDF cosine similarity
- Priority/severity scoring
- Capability-based partner matching
- University challenge acceptance and status updates
- Industry collaboration status
- Government analytics dashboard
- SQLite persistence
- JWT authentication
- Responsive presentation-ready UI
- Demo seed data

## Run in VS Code

### 1. Open this folder in VS Code

Open the `jansahyog_mvp` folder.

### 2. Create a virtual environment

Windows:
```powershell
python -m venv .venv
.venv\Scripts\activate
```

macOS/Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install packages

```bash
pip install -r requirements.txt
```

### 4. Start the server

```bash
uvicorn backend.main:app --reload
```

### 5. Open

http://127.0.0.1:8000

## Demo accounts

All demo accounts use password: `demo123`

- Citizen: citizen@jansahyog.demo
- University: university@jansahyog.demo
- Industry: industry@jansahyog.demo
- Government: government@jansahyog.demo

## Demo flow for SIH

1. Login as Citizen.
2. Submit a problem such as:
   `Residents near a mining area are facing contaminated groundwater and unsafe drinking water.`
3. The system automatically identifies the domain.
4. It checks similar existing problems.
5. It calculates a priority score.
6. It recommends universities/industry partners.
7. Login as University and accept the challenge.
8. Update its collaboration status.
9. Login as Government and view the state-level dashboard.

## Important MVP note

This is an MVP designed to demonstrate the complete product workflow locally. The categorization and matching are intentionally lightweight and deterministic so the application works without external API keys.

For a production/SIH-final version, the AI layer can be upgraded to a trained multilingual classifier and Sentence Transformers + PostgreSQL/pgvector without changing the product flow.
