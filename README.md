# UniTask

Sua faculdade, organizada em um só lugar.

MVP web full stack para centralizar matérias, tarefas, provas, notas, calendário e dashboard acadêmico.

## Stack

| Camada | Tecnologia | Hospedagem |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind | Vercel |
| Backend | Django + Django REST Framework | Render |
| Banco | PostgreSQL | Neon |

## Estrutura

```text
unitask/
├── frontend/     # Interface web
├── backend/      # API Django
├── docs/         # Requisitos, arquitetura e deploy
└── README.md
```

## Pré-requisitos

- Python 3.12+
- Node.js 20+
- Contas (para publicação): GitHub, Neon, Render, Vercel

## Execução local

### 1. Backend

```bash
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# Linux/macOS
source .venv/bin/activate

pip install -r backend/requirements.txt
copy backend\.env.example backend\.env   # Windows
# cp backend/.env.example backend/.env   # Linux/macOS

cd backend
python manage.py migrate
python manage.py runserver
```

API: http://127.0.0.1:8000  
Health: http://127.0.0.1:8000/api/health/

### 2. Frontend

Em outro terminal:

```bash
cd frontend
copy .env.example .env   # Windows
# cp .env.example .env   # Linux/macOS
npm install
npm run dev
```

App: http://localhost:5173

## Testes

```bash
# Backend
cd backend
python manage.py test

# Frontend (build de verificação)
cd frontend
npm run build
```

## Publicação (ordem correta)

1. Push no GitHub  
2. Criar PostgreSQL no **Neon** → copiar `DATABASE_URL`  
3. Criar Web Service no **Render** (root `backend`) → validar `/api/health/`  
4. Publicar frontend na **Vercel** (root `frontend`) com `VITE_API_BASE_URL`  
5. Atualizar `CORS_ALLOWED_ORIGINS` no Render com a URL da Vercel  

Detalhes: [docs/deployment.md](docs/deployment.md)

## Documentação

- [Requisitos](docs/product-requirements.md)
- [Arquitetura](docs/architecture.md)
- [Banco de dados](docs/database.md)
- [Decisões](docs/decisions.md)
- [Deploy](docs/deployment.md)
- [Plano de ação](UniTask_Plano_de_Acao_Cursor.md)

## Auth (API)

| Método | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/register/` | pública |
| POST | `/api/auth/login/` | pública (`email` + `password`) |
| POST | `/api/auth/refresh/` | pública (`refresh`) |
| GET/PATCH | `/api/auth/me/` | Bearer JWT |
| GET/POST | `/api/subjects/` | Bearer JWT |
| GET/PATCH/DELETE | `/api/subjects/{id}/` | Bearer JWT |
| GET/POST | `/api/events/` | Bearer JWT |
| GET/PATCH/DELETE | `/api/events/{id}/` | Bearer JWT |
| GET/POST | `/api/tasks/` | Bearer JWT |
| GET/PATCH/DELETE | `/api/tasks/{id}/` | Bearer JWT |
| GET/POST | `/api/assessments/` | Bearer JWT |
| GET/PATCH/DELETE | `/api/assessments/{id}/` | Bearer JWT |
| GET | `/api/grades/summary/` | Bearer JWT (`?subject=` opcional) |
| GET | `/api/dashboard/` | Bearer JWT (resumo + alertas in-app) |

## Status atual

**Fase 8 — Qualidade visual:** identidade UniTask (logo/favicon), tipografia Sora/Manrope, shell, login hero e painéis refinados (paleta do pitch).  
App: https://unitask-trabalho.vercel.app · API: https://unitask-api-2nvd.onrender.com
