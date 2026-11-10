# UniTask — Decisões do MVP

Registro das decisões travadas para evitar retrabalho.

| ID | Tema | Decisão | Data |
|---|---|---|---|
| D01 | Stack | React+TS+Vite+Tailwind / Django+DRF / Neon / Render / Vercel | 2026-03-09 |
| D02 | Auth | JWT via SimpleJWT (access + refresh) | 2026-03-09 |
| D03 | Médias | `passing_grade` por matéria (padrão 6.0); escala 0–10; pesos opcionais; sem recuperação. Média atual só com `score` preenchido (ponderada se todas as lançadas têm peso; senão simples). Nota necessária só com pesos em todas OU sem peso em todas; caso misto → não calcula | 2026-03-09 |
| D04 | Alertas | Somente in-app via `GET /api/dashboard/`; janela de 3 dias; vencidos + due_soon; sem push/e-mail; sem persistir `Notification` no MVP (calculados na hora) | 2026-03-09 |
| D05 | Tarefas | `subject` opcional | 2026-03-09 |
| D06 | Premium | Fora do MVP | 2026-03-09 |
| D07 | Supabase | Não usar no MVP (evitar mistura com Django) | 2026-03-09 |
| D08 | Deploy | Ordem: GitHub → Neon → Render → Vercel → CORS | 2026-03-09 |
| D09 | Tokens no frontend | `localStorage` aceitável no MVP (documentado) | 2026-03-09 |
| D10 | Exclusão de matéria | Preferir arquivar; FKs com PROTECT onde fizer sentido | 2026-03-09 |
| D11 | User model | Custom user com e-mail como USERNAME_FIELD (`users.User`) | 2026-03-10 |
| D12 | Tokens JWT | Access 60 min / Refresh 7 dias; frontend em localStorage no MVP | 2026-03-10 |
