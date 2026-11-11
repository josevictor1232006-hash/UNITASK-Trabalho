# UniTask - IBMEC

**Sua faculdade, organizada em um só lugar.**

O UniTask é um sistema web para o estudante universitário centralizar a rotina acadêmica: matérias, provas, trabalhos, tarefas, calendário, notas, médias e um dashboard com alertas de prazo.

**App:** https://unitask-trabalho.vercel.app

---

## O que o sistema faz

### Conta do estudante
- Cadastro, login e logout
- Sessão protegida por usuário (cada estudante vê apenas os próprios dados)

### Matérias
- Cadastrar, editar, listar e excluir disciplinas
- Arquivar matérias que não estão em uso
- Definir cor, código, professor e média de aprovação

### Provas e trabalhos
- Registrar provas, trabalhos e outros compromissos
- Vincular (opcionalmente) a uma matéria
- Filtrar por status (agendado, concluído, cancelado)
- Concluir ou editar eventos existentes

### Tarefas
- Criar, editar, concluir, reabrir e excluir tarefas
- Prioridade (baixa, média, alta) e prazo opcional
- Matéria opcional
- Filtros por status

### Calendário acadêmico
- Visão mensal com provas, trabalhos e tarefas
- Diferenciação visual por tipo de compromisso
- Detalhe ao clicar no dia ou no item

### Notas e médias
- Lançar avaliações por matéria (nota, peso opcional, data)
- Cálculo automático da média atual (simples ou ponderada)
- Indicação da nota necessária nas avaliações pendentes para atingir a aprovação
- Situação da matéria (na média / abaixo da aprovação)

### Dashboard e alertas
- Resumo de matérias ativas e tarefas
- Próximas provas, trabalhos e tarefas
- Alertas in-app de prazos **vencidos** e dos **próximos 3 dias**
- Destaque das médias por matéria

### Exportação
- Exportar para Excel (`.xlsx`) as listas de matérias, provas/trabalhos, tarefas e notas

---

## Como usar (fluxo típico)

1. Crie sua conta e entre no sistema  
2. Cadastre suas **matérias**  
3. Lance **provas/trabalhos** e **tarefas** com prazos  
4. Acompanhe tudo no **calendário** e no **dashboard**  
5. Registre **notas** e veja a média / o que falta para passar  
6. Exporte relatórios em Excel quando precisar  

---

## Execução local (resumo)

**Backend**

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # Windows
# source .venv/bin/activate           # Linux/macOS
pip install -r backend/requirements.txt
copy backend\.env.example backend\.env
cd backend
python manage.py migrate
python manage.py runserver
```

**Frontend** (outro terminal)

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

- App: http://localhost:5173  
- API: http://127.0.0.1:8000  

Detalhes de publicação: [docs/deployment.md](docs/deployment.md)

---

## Documentação

| Documento | Conteúdo |
|---|---|
| [Requisitos](docs/product-requirements.md) | Escopo do MVP |
| [Arquitetura](docs/architecture.md) | Visão técnica |
| [Banco de dados](docs/database.md) | Modelo e regras de média |
| [Decisões](docs/decisions.md) | Decisões travadas do projeto |
| [Deploy](docs/deployment.md) | Neon → Render → Vercel |

---

## Stack técnica (resumo)

| Camada | Tecnologias | Hospedagem |
|---|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS | Vercel |
| Backend | Python, Django, Django REST Framework, JWT | Render |
| Banco | PostgreSQL | Neon |
| Exportação | SheetJS (xlsx) | — |

API pública atual: https://unitask-api-2nvd.onrender.com  
Health: `/api/health/`
