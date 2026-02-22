# 🛡 DeployGuard

Pre-CI Pull Request risk analysis using a multi-agent LangGraph pipeline.

## What it does
Whenever a PR is opened on a connected GitHub repo, DeployGuard automatically analyzes the changes and posts a risk report as a PR comment — before CI even runs.

## Tech Stack
- Frontend: React + TypeScript + Tailwind
- Backend: Express.js + TypeScript
- Agents: LangGraph + Google Gemini
- Database: Supabase (PostgreSQL)

## Setup

### 1. Clone the repo
git clone https://github.com/yourusername/deployguard.git

### 2. Setup environment variables
Create .env files in backend/, frontend/ and agents/ folders.

## Backend .env:
- PORT=4000
- SUPABASE_URL=your_supabase_url
- SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
- WEBHOOK_SECRET=your_webhook_secret
- WEBHOOK_URL=your_ngrok_or_public_url
- ENCRYPTION_KEY=your_encryption_key

## Agents .env:
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

## Frontend .env:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:4000

### 3. Install dependencies
cd backend && npm install
cd ../agents && npm install
cd ../frontend && npm install

### 4. Run the app
Terminal 1: cd backend && npm run dev
Terminal 2: ngrok http 4000 
Terminal 3: cd frontend && npm run dev
