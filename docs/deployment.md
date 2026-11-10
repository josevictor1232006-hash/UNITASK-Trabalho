# UniTask — Publicação (Neon → Render → Vercel)

Ordem obrigatória. Não publique o frontend antes da API ter URL pública.

## Pré-requisitos

- Contas: GitHub, [Neon](https://neon.tech), [Render](https://render.com), [Vercel](https://vercel.com)
- Repositório com `backend/` e `frontend/` na branch `main`
- Nenhum `.env` com segredos no Git

---

## 0) GitHub

1. Criar repositório `unitask`.
2. Push da `main`.
3. Confirmar que `.gitignore` cobre `.env`, `venv/`, `node_modules/`, `__pycache__/`, `dist/`.

---

## 1) Neon (banco primeiro)

1. New Project → PostgreSQL → região próxima.
2. Copiar connection string (`postgresql://...?sslmode=require`).
3. Guardar fora do Git.
4. Essa string será `DATABASE_URL` no Render.
5. Migrations rodam no build/start do Render — não no painel do Neon.

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
