# UniTask — Decisões do MVP

Registro das decisões travadas para evitar retrabalho.

| ID | Tema | Decisão | Data |
|---|---|---|---|
| D01 | Stack | React+TS+Vite+Tailwind / Django+DRF / Neon / Render / Vercel | 2026-03-09 |
| D02 | Auth | JWT via SimpleJWT (access + refresh) | 2026-03-09 |
| D03 | Médias | `passing_grade` por matéria (padrão 6.0); pesos opcionais; sem recuperação | 2026-03-09 |
| D04 | Alertas | Somente in-app; janela de 3 dias antes do vencimento | 2026-03-09 |
| D05 | Tarefas | `subject` opcional | 2026-03-09 |
| D06 | Premium | Fora do MVP | 2026-03-09 |
| D07 | Supabase | Não usar no MVP (evitar mistura com Django) | 2026-03-09 |
| D08 | Deploy | Ordem: GitHub → Neon → Render → Vercel → CORS | 2026-03-09 |
| D09 | Tokens no frontend | `localStorage` aceitável no MVP (documentado) | 2026-03-09 |
| D10 | Exclusão de matéria | Preferir arquivar; FKs com PROTECT onde fizer sentido | 2026-03-09 |
