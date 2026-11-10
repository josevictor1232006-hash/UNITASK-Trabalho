# UniTask — Modelo de dados

Toda entidade acadêmica pertence a um `User` (direta ou indiretamente).  
`user_id` nunca é confiado a partir do frontend; deriva do JWT.

## Entidades

### User
- id, name, email (unique), password (hash Django), created_at

### Subject (Matéria)
- id, user_id, name, code (opcional), professor (opcional), color (opcional)
- passing_grade (default 6.0), is_archived (default false)
- created_at, updated_at

### AcademicEvent
- id, user_id, subject_id (nullable)
- title, description (nullable)
- event_type: `exam` | `assignment` | `other`
- start_at, due_at (nullable), status
- created_at

### Task
- id, user_id, subject_id (nullable), academic_event_id (nullable)
- title, description (nullable), due_at
- status: `pending` | `in_progress` | `done`
- priority: `low` | `medium` | `high`
- created_at, updated_at

### Assessment (Avaliação/Nota)
- id, user_id, subject_id
- name, score (nullable até realizar), weight (nullable / opcional)
- date (nullable), created_at

### Notification (Alerta interno)
- **MVP:** não persistido — alertas são agregados em `/api/dashboard/` a partir de eventos/tarefas.
- Modelo futuro (fora do MVP ativo): id, user_id, task_id, academic_event_id, title, message, scheduled_at, read_at, created_at

## Relacionamentos

```text
User 1──* Subject
User 1──* AcademicEvent
User 1──* Task
User 1──* Assessment
User 1──* Notification
Subject 1──* AcademicEvent
Subject 1──* Task
Subject 1──* Assessment
AcademicEvent 1──* Task (opcional)
Task / AcademicEvent ──* Notification (opcional)
```

## Regras de integridade

- Filtrar sempre por `request.user`.
- Validar que `subject` referenciada pertence ao usuário.
- Exclusão de Subject: bloquear se houver dependências ativas **ou** cascata documentada — MVP: `PROTECT` em FKs críticas e arquivamento preferencial.
- Timestamps com timezone (`USE_TZ=True`).

## Cálculo de média (MVP)

- Se houver pesos: média ponderada `sum(score * weight) / sum(weight)` (somente avaliações com `score` preenchido).
- Se pesos ausentes: média aritmética simples.
- Nota necessária: exibida apenas quando matematicamente possível com avaliações restantes/pesos definidos.
