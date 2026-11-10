# UniTask — Arquitetura

## Visão geral

```text
Usuário / Navegador
        |
        v
Frontend React + TypeScript + Vite
        (Vercel Hobby)
        |
   HTTPS / JSON + JWT
        |
        v
API Django + Django REST Framework
        (Render Web Service Free)
        |
   DATABASE_URL (SSL)
        |
        v
PostgreSQL
        (Neon Free)
```

O navegador **nunca** acessa o PostgreSQL. Toda leitura/escrita passa pela API.

## Stack fechada para o MVP

| Camada | Tecnologia | Onde roda |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind | Vercel |
| Backend | Python + Django + DRF | Render |
| Auth | JWT (SimpleJWT) | Backend |
| Banco | PostgreSQL | Neon |
| Versionamento | Git + GitHub | GitHub |

**Decisão:** não usar Supabase no MVP. Manter Django para praticar full stack tradicional.

## Responsabilidades

| Camada | Faz | Não faz |
|---|---|---|
| Frontend | UI, formulários, navegação, estados de loading/erro | Regras de negócio, cálculo oficial de média, acesso ao banco |
| Backend | Auth, validação, CRUD, isolamento por usuário, médias, dashboard | Armazenar arquivos locais no disco do Render |
| Banco | Persistência | Lógica de negócio |

## Autenticação

- Cadastro/login via API.
- Tokens JWT (access + refresh).
- Frontend guarda tokens de forma segura (preferência: memória + refresh controlado; evitar localStorage se possível — no MVP, `localStorage` é aceitável se documentado).
- Endpoints privados exigem `Authorization: Bearer <access>`.
- `user_id` **nunca** vem do body/query do cliente; vem do token.

## Isolamento de dados

- Toda entidade acadêmica pertence a um `User`.
- Querysets filtrados por `request.user`.
- Testes obrigatórios de acesso cruzado (usuário A não lê/edita dados de B).

## Variáveis de ambiente

### Backend (`backend/.env`)

| Variável | Uso |
|---|---|
| `SECRET_KEY` | Django |
| `DEBUG` | `True` local / `False` produção |
| `DATABASE_URL` | Connection string Neon |
| `ALLOWED_HOSTS` | Hosts do Render |
| `CORS_ALLOWED_ORIGINS` | URL do frontend Vercel |
| `DJANGO_SUPERUSER_*` | Opcional, só se criar admin no deploy |

### Frontend (`frontend/.env`)

| Variável | Uso |
|---|---|
| `VITE_API_BASE_URL` | URL pública da API no Render |

Nunca versionar `.env` com valores reais. Usar `.env.example` só com nomes.

## Limitações dos planos gratuitos

| Serviço | Risco relevante |
|---|---|
| Render Free | Sleep após ~15 min sem tráfego; cold start ~1 min; disco efêmero |
| Neon Free | Compute pode hibernar; limites de storage/horas |
| Vercel Hobby | Uso pessoal/não comercial nos termos; limites de build/banda |

Conferir sempre: [Render Free](https://render.com/docs/free), [Neon Pricing](https://neon.com/pricing), [Vercel Hobby](https://vercel.com/docs/plans/hobby).
