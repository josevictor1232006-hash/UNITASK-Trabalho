# UniTask — Publicação (Neon → Render → Vercel)

Ordem obrigatória. Não publique o frontend antes da API ter URL pública.

## Pré-requisitos

- Contas: GitHub, [Neon](https://neon.tech), [Render](https://render.com), [Vercel](https://vercel.com)
- Repositório com `backend/` e `frontend/` na branch `main`
- Nenhum `.env` com segredos no Git

---

## 0) GitHub

Status: **concluído** — https://github.com/josevictor1232006-hash/UNITASK-Trabalho

1. Repositório criado e `main` publicada.
2. `.gitignore` cobre `.env`, `.venv/`, `node_modules/`, `__pycache__/`, `dist/`.

---

## 1) Neon (banco primeiro) — FAÇA AGORA

1. Acesse https://neon.tech e crie/entrar na conta.
2. **New Project** → nome `unitask` → PostgreSQL → região próxima (ex. São Paulo, se disponível).
3. Em **Dashboard → Connection string**, copie a URL no formato:
   `postgresql://USER:PASSWORD@HOST/DB?sslmode=require`
4. Guarde em local seguro (bloco de notas / gerenciador de senhas). **Nunca** cole no GitHub.
5. Para testar localmente (opcional):
   - Cole em `backend/.env` como `DATABASE_URL=...`
   - Rode `python manage.py migrate`
6. No Render (próximo passo), a mesma string vira a variável `DATABASE_URL`.
7. Migrations rodam no deploy do Render — não no painel do Neon.

---

## 2) Render (API)

1. **New → Web Service** → conectar o repo GitHub.
2. Configuração:

| Campo | Valor |
|---|---|
| Root Directory | `backend` |
| Runtime | Python |
| Build Command | `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate --noinput` |
| Start Command | `gunicorn config.wsgi:application` |
| Plan | Free |

3. Environment variables:

| Nome | Valor |
|---|---|
| `SECRET_KEY` | string longa aleatória |
| `DEBUG` | `False` |
| `DATABASE_URL` | connection string do Neon |
| `ALLOWED_HOSTS` | hostname do serviço (ex. `unitask-api.onrender.com`) |
| `CORS_ALLOWED_ORIGINS` | preencher depois com a URL da Vercel |
| `PYTHON_VERSION` | `3.12.0` (se necessário) |

4. Deploy → copiar URL da API.
5. Validar `GET /api/health/` (cold start ~1 min no Free).

**Limites Free:** sleep ~15 min ocioso; disco efêmero.

---

## 3) Vercel (frontend)

1. **Add New Project** → mesmo repo.
2. Configuração:

| Campo | Valor |
|---|---|
| Root Directory | `frontend` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

3. Env: `VITE_API_BASE_URL=https://<sua-api>.onrender.com` (sem barra final).
4. Deploy → copiar URL do frontend.
5. `vercel.json` com rewrite SPA para `index.html`.

---

## 4) Fechar o circuito

1. No Render: `CORS_ALLOWED_ORIGINS=https://<seu-app>.vercel.app`
2. Redeploy do backend.
3. Smoke test: cadastro → login → criar matéria → F5 → persiste.
4. Atualizar README com URLs públicas (sem segredos).

## Checklist rápido

- [ ] Neon criado e `DATABASE_URL` salva com segurança
- [ ] Render com migrate + health OK
- [ ] Vercel com `VITE_API_BASE_URL` apontando para a API
- [ ] CORS restrito à origem do frontend
- [ ] `DEBUG=False` em produção
