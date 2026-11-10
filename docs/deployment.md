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

## 1) Neon (banco primeiro)

Status: **concluído** — projeto `hidden-hill-70575855` (`my-first-project`), org `org-orange-glitter-20441171`.

Console: https://console.neon.tech/app/projects/hidden-hill-70575855/

1. CLI Neon autenticada e projeto linkado via `neon init`.
2. Variáveis em `.env.local` (raiz) e `DATABASE_URL` espelhada em `backend/.env` (locais, fora do Git).
3. Migrations Django aplicadas no PostgreSQL Neon.
4. No Render, cadastrar a mesma `DATABASE_URL` como secret (não versionar).

---

## 2) Render (API)

Status: **concluído** — `https://unitask-api-2nvd.onrender.com`  
Health: `https://unitask-api-2nvd.onrender.com/api/health/` → `{"status":"ok","service":"unitask-api"}`

### Como foi feito

O repositório inclui `render.yaml` (Blueprint). Prefira esse caminho.

### Opção A — Blueprint (recomendado)

1. Acesse https://dashboard.render.com e entre com a **mesma conta GitHub** do repo.
2. **New → Blueprint**.
3. Conecte `josevictor1232006-hash/UNITASK-Trabalho` (autorize a organização se pedir).
4. Branch: `main`. Render deve detectar `render.yaml`.
5. Em Environment Variables, preencha **somente** `DATABASE_URL`:
   - Abra o Neon Console → Connection string
   - Ou copie do seu `.env.local` local (chave `DATABASE_URL`)
   - Cole no Render como secret (não compartilhe no chat)
6. Apply / Create resources.
7. Aguarde o deploy do serviço `unitask-api`.
8. Abra a URL pública + `/api/health/`  
   Ex.: `https://unitask-api.onrender.com/api/health/`  
   (no Free, o primeiro acesso pode levar ~1 min — cold start)

### Opção B — Web Service manual

1. **New → Web Service** → repo `UNITASK-Trabalho`.
2. Configuração:

| Campo | Valor |
|---|---|
| Name | `unitask-api` |
| Root Directory | `backend` |
| Runtime | Python |
| Build Command | `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate --noinput` |
| Start Command | `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT` |
| Instance | Free |

3. Environment variables:

| Nome | Valor |
|---|---|
| `PYTHON_VERSION` | `3.12.0` |
| `SECRET_KEY` | Generate / string longa aleatória |
| `DEBUG` | `False` |
| `DATABASE_URL` | connection string do Neon |
| `ALLOWED_HOSTS` | `.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` (atualiza depois com a Vercel) |

4. Create Web Service → validar `/api/health/`.

**Limites Free:** sleep ~15 min ocioso; disco efêmero.

### Depois do deploy

1. Copiar a URL da API (ex. `https://unitask-api.onrender.com`).
2. Guardar para o passo Vercel (`VITE_API_BASE_URL`).
3. Opcional: setar `CSRF_TRUSTED_ORIGINS=https://unitask-api.onrender.com`.

---

## 3) Vercel (frontend)

Status: **concluído** — https://unitask-trabalho.vercel.app  
Env: `VITE_API_BASE_URL=https://unitask-api-2nvd.onrender.com`

1. Root Directory: `frontend`
2. Framework: Vite · Build: `npm run build` · Output: `dist`
3. `vercel.json` com rewrite SPA.

---

## 4) Fechar o circuito (CORS)

1. No Render → `unitask-api` → **Environment**:
   ```text
   CORS_ALLOWED_ORIGINS=https://unitask-trabalho.vercel.app,http://localhost:5173,http://127.0.0.1:5173
   ```
2. **Manual Deploy** do backend (ou aguarde sync do Blueprint).
3. Recarregue https://unitask-trabalho.vercel.app — Status da API deve ficar verde.
4. Smoke test: cadastro → login → F5 → sessão/persiste.

## Checklist rápido

- [ ] Neon criado e `DATABASE_URL` salva com segurança
- [ ] Render com migrate + health OK
- [ ] Vercel com `VITE_API_BASE_URL` apontando para a API
- [ ] CORS restrito à origem do frontend
- [ ] `DEBUG=False` em produção
