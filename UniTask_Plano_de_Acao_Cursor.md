# UniTask — Plano de ação técnico e prompt para Cursor

> **Objetivo:** transformar o documento oficial do UniTask em um MVP web funcional, versionado no Git e publicado por um link público, utilizando serviços gratuitos.
>
> **Escopo deste plano:** primeira versão para validação acadêmica e uso inicial. Não representa uma arquitetura de produção com SLA, backups gerenciados ou disponibilidade garantida.

---

## 1. Visão do produto

O UniTask centraliza a rotina acadêmica do estudante em um único lugar. O documento oficial apresenta seis funcionalidades principais:

1. **Cadastro de matérias:** organizar as disciplinas.
2. **Calendário de provas e trabalhos:** visualizar compromissos acadêmicos.
3. **Alertas inteligentes:** avisar sobre prazos importantes.
4. **Cálculo automático de médias:** calcular médias e quanto falta para atingir a nota necessária.
5. **Dashboard acadêmico:** exibir uma visão consolidada da situação do estudante.
6. **Gerenciamento de tarefas:** criar, organizar e acompanhar atividades.

O documento também menciona uma modalidade gratuita e uma Premium. O MVP deve implementar somente o núcleo gratuito; recursos Premium ficam fora do primeiro ciclo.

### 1.1 Requisitos derivados para o MVP

A documentação apresenta os nomes e objetivos das funcionalidades, mas não define regras detalhadas, campos, fórmulas de média, política de alertas ou permissões. Portanto, os itens abaixo são **propostas técnicas para operacionalizar o escopo**, e devem ser confirmados antes da implementação.

| Módulo | Entrega inicial proposta |
|---|---|
| Conta e autenticação | Cadastro, login, logout e recuperação de acesso, se suportada pelo fluxo escolhido |
| Matérias | Criar, listar, editar, arquivar e excluir disciplinas |
| Atividades acadêmicas | Registrar prova, trabalho e outros compromissos vinculados a uma matéria |
| Tarefas | Criar, editar, concluir, reabrir e excluir tarefas |
| Calendário | Visualizações mensal e/ou semanal com provas, trabalhos e tarefas |
| Notas e médias | Registrar avaliações/notas e configurar a regra de cálculo por disciplina |
| Dashboard | Próximos prazos, tarefas pendentes/concluídas e resumo das disciplinas |
| Alertas | Exibir avisos dentro do app para prazos próximos e vencidos |

### 1.2 Regras que precisam ser decididas

Não inventar regras acadêmicas. Antes de implementar o cálculo de notas, definir com o responsável pelo produto:

- A média de aprovação é fixa ou configurável por matéria?
- As avaliações têm pesos? O peso é obrigatório?
- Existe prova final/recuperação?
- Como calcular a nota necessária quando ainda faltam avaliações?
- O calendário deve considerar apenas eventos cadastrados manualmente ou terá integração futura com sistemas da faculdade?
- Quantos dias antes do vencimento um alerta deve aparecer?
- Uma tarefa pode existir sem estar vinculada a uma matéria?

**Recomendação:** começar com uma regra configurável por disciplina, com avaliações e pesos opcionais. Documentar a fórmula adotada e cobrir os casos com testes. Não presumir que todas as faculdades usam a mesma regra.

---

## 2. Arquitetura recomendada — simples, separada e gratuita

### 2.1 Stack proposta

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Frontend | React + TypeScript + Vite | Interface web responsiva |
| UI | Tailwind CSS ou biblioteca de componentes escolhida pelo projeto | Estilo e componentes |
| Backend | Python + Django + Django REST Framework | API, regras de negócio e autenticação |
| Banco de dados | PostgreSQL no Neon Free | Persistência dos dados |
| Hospedagem do frontend | Vercel Hobby ou Render Static Site | Publicar a aplicação web |
| Hospedagem da API | Render Web Service Free | Executar a API Django |
| Versionamento | Git + GitHub | Histórico e colaboração |
| Testes | Pytest/Django Test + Vitest/Testing Library | Testes do backend e frontend |

**Por que essa arquitetura?** Ela separa interface, regras de negócio e dados. Também permite evoluir o backend sem reescrever o frontend. É uma combinação compatível com um projeto pequeno e com tecnologias amplamente utilizadas.

### 2.2 Diagrama da arquitetura

```text
                 Usuário / Navegador
                         |
                         v
              Frontend React + Vite
                  Vercel / Render
                         |
                    HTTPS / JSON
                         |
                         v
               API Django + DRF
                    Render
                         |
                    PostgreSQL
                       Neon
```

O navegador nunca deve conectar diretamente ao banco PostgreSQL. Toda operação com dados deve passar pela API, que valida a identidade do usuário e suas permissões.

### 2.3 Alternativa ainda mais simples

Se a prioridade absoluta for reduzir a quantidade de serviços e código de infraestrutura, pode-se avaliar **React + Supabase** (Auth, PostgreSQL e APIs gerenciadas), hospedando o frontend na Vercel ou Render. Nesse desenho, parte do backend Django deixa de ser necessária.

**Decisão sugerida para este projeto:** manter Django + DRF + PostgreSQL, caso o objetivo também seja praticar uma arquitetura full stack tradicional e aproveitar a familiaridade da equipe com Python. Não misturar as duas abordagens no MVP.

---

## 3. Serviços gratuitos: o que usar e quais são as limitações

Os planos gratuitos mudam. Conferir os limites e termos diretamente nos sites oficiais antes de publicar e periodicamente durante o projeto.

### 3.1 Frontend — Vercel ou Render Static Site

**Opção A — Vercel Hobby**
- Conectar o repositório GitHub.
- Importar o projeto frontend.
- Configurar a pasta raiz do frontend, comando de build e diretório de saída.
- Cadastrar a variável pública com a URL da API.
- Cada push na branch configurada pode gerar um novo deploy.

A Vercel informa que o plano Hobby é gratuito e voltado a projetos pessoais e pequenos aplicativos, mas restringe seu uso a fins pessoais e não comerciais. Verificar os termos antes de usar em um produto comercial.

Documentação: https://vercel.com/docs/plans/hobby

**Opção B — Render Static Site**
- Também permite publicar o frontend estático gratuitamente.
- É uma alternativa caso os termos do Vercel Hobby não sejam adequados ao uso pretendido.

Documentação: https://render.com/docs/free

### 3.2 Backend — Render Free

- Criar um Web Service conectado ao repositório.
- Configurar a raiz da aplicação backend.
- Informar comandos de instalação e inicialização do Django.
- Configurar variáveis de ambiente.
- Configurar CORS para aceitar somente a origem do frontend publicado.

**Limitações importantes:** serviços gratuitos do Render entram em suspensão após 15 minutos sem tráfego e podem levar aproximadamente um minuto para voltar a responder. O sistema de arquivos local é efêmero. Não armazenar arquivos enviados por usuários no disco local do serviço.

Documentação: https://render.com/docs/free

### 3.3 Banco de dados — Neon Free

- Criar um projeto PostgreSQL no Neon.
- Copiar a connection string.
- Salvar a string como variável secreta no Render.
- Usar SSL conforme exigido pela connection string.
- Executar as migrations do Django no processo de deploy ou em etapa controlada.

A página oficial do Neon informa limites gratuitos, incluindo armazenamento e horas de computação. O banco pode reduzir a escala quando fica inativo e voltar a iniciar quando recebe conexões.

Documentação: https://neon.com/pricing

**Importante:** não usar o PostgreSQL gratuito do Render como banco permanente deste MVP sem avaliar a política de expiração. A documentação do Render informa que bancos Free expiram após 30 dias. O Neon é a opção indicada neste plano para persistência contínua dentro das cotas gratuitas.

### 3.4 Alternativa de backend gerenciado — Supabase

O Supabase Free oferece PostgreSQL, autenticação e APIs gerenciadas, reduzindo a necessidade de manter um backend próprio. A documentação de preços informa cotas gratuitas e pausa de projetos inativos. É uma alternativa válida, mas deve ser escolhida no lugar do Django, não adicionada sem necessidade.

Documentação: https://supabase.com/pricing

---

## 4. Organização do repositório

Se o repositório já foi criado, primeiro inspecionar sua estrutura. Não apagar ou substituir arquivos existentes sem entender sua finalidade.

Uma estrutura possível para monorepo:

```text
unitask/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── subjects/
│   │   │   ├── calendar/
│   │   │   ├── tasks/
│   │   │   ├── grades/
│   │   │   └── dashboard/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── styles/
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── config/
│   ├── apps/
│   │   ├── users/
│   │   ├── subjects/
│   │   ├── academic_events/
│   │   ├── tasks/
│   │   └── grades/
│   ├── tests/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
├── docs/
│   ├── product-requirements.md
│   ├── architecture.md
│   ├── database.md
│   └── deployment.md
│
├── .gitignore
├── README.md
└── LICENSE (se aplicável)
```

A estrutura é uma sugestão, não uma ordem para reorganizar cegamente o repositório. O Cursor deve primeiro verificar o que já existe e propor adaptações mínimas.

### 4.1 Arquivos importantes

- `.gitignore`: ignorar `node_modules`, ambientes virtuais, caches, arquivos `.env`, banco local e artefatos de build.
- `.env.example`: listar nomes de variáveis necessárias, sem valores reais.
- `README.md`: explicar o produto, tecnologias, instalação local, testes e deploy.
- `docs/`: manter requisitos, decisões de arquitetura e instruções operacionais.

Nunca versionar senhas, tokens, chaves privadas, connection strings reais ou arquivos de credenciais.

---

## 5. Modelo de dados inicial

O modelo abaixo é uma proposta inicial a validar. Toda entidade acadêmica deve pertencer a um usuário, diretamente ou por meio de uma entidade que também pertença a ele.

### User
- id
- nome
- email
- password (gerenciado pelo Django; nunca armazenar senha em texto puro)
- created_at

### Subject (Matéria)
- id
- user_id
- nome
- código (opcional)
- professor (opcional)
- cor (opcional)
- média_de_aprovação
- created_at
- updated_at

### AcademicEvent (Evento acadêmico)
- id
- user_id
- subject_id (opcional, conforme regra definida)
- título
- descrição (opcional)
- tipo: prova, trabalho ou outro
- start_at
- due_at (opcional)
- status
- created_at

### Task (Tarefa)
- id
- user_id
- subject_id (opcional)
- academic_event_id (opcional)
- título
- descrição (opcional)
- due_at
- status: pendente, em andamento ou concluída
- priority
- created_at
- updated_at

### Assessment (Avaliação/Nota)
- id
- user_id
- subject_id
- nome
- nota_obtida (opcional enquanto não realizada)
- peso (conforme regra escolhida)
- data (opcional)
- created_at

### Notification (Alerta interno)
- id
- user_id
- task_id (opcional)
- academic_event_id (opcional)
- título
- mensagem
- scheduled_at
- read_at (opcional)
- created_at

**Regras essenciais de integridade e segurança:**
- Validar no backend que a matéria referenciada pertence ao usuário autenticado.
- Não confiar em `user_id` enviado pelo frontend; derivar o proprietário do usuário autenticado.
- Aplicar filtros por usuário em todas as consultas e operações.
- Impedir que um usuário consulte, edite ou exclua dados de outro usuário alterando IDs na URL.
- Definir exclusão em cascata ou bloqueio de exclusão conscientemente e documentar a decisão.
- Usar datas com timezone e armazenar timestamps de forma consistente.

---

## 6. Contrato inicial da API

Os endpoints são uma proposta de organização. O Cursor deve conferir convenções do projeto e documentar o contrato final.

| Método | Endpoint | Finalidade |
|---|---|---|
| POST | `/api/auth/register/` | Criar conta |
| POST | `/api/auth/login/` | Autenticar |
| POST | `/api/auth/refresh/` | Renovar token, se JWT for adotado |
| GET/PATCH | `/api/auth/me/` | Consultar/atualizar perfil |
| GET/POST | `/api/subjects/` | Listar/criar matérias |
| GET/PATCH/DELETE | `/api/subjects/{id}/` | Consultar/editar/excluir matéria |
| GET/POST | `/api/events/` | Listar/criar eventos acadêmicos |
| GET/PATCH/DELETE | `/api/events/{id}/` | Consultar/editar/excluir evento |
| GET/POST | `/api/tasks/` | Listar/criar tarefas |
| GET/PATCH/DELETE | `/api/tasks/{id}/` | Consultar/editar/excluir tarefa |
| GET/POST | `/api/assessments/` | Listar/criar avaliações |
| GET/PATCH/DELETE | `/api/assessments/{id}/` | Consultar/editar/excluir avaliação |
| GET | `/api/dashboard/` | Dados consolidados do painel |
| GET | `/api/notifications/` | Listar alertas internos |
| PATCH | `/api/notifications/{id}/read/` | Marcar alerta como lido |

Prever paginação quando necessário, validação consistente, respostas de erro claras e documentação OpenAPI/Swagger.

---

## 7. Plano de execução — passo a passo

A ordem abaixo reduz retrabalho. Cada fase deve terminar com código executável, testes e documentação mínima antes de avançar.

### Fase 0 — Diagnóstico do repositório e decisões

1. Abrir o repositório existente.
2. Identificar arquivos, tecnologias, branches e estado atual.
3. Verificar se já existe frontend/backend ou se o repositório está vazio.
4. Registrar o que pode ser reaproveitado.
5. Confirmar as regras de cálculo de notas e alertas.
6. Criar `docs/product-requirements.md` e `docs/architecture.md`.
7. Criar uma lista de tarefas priorizada.

**Critério de conclusão:** arquitetura e escopo do MVP documentados; nenhuma implementação grande iniciada antes da aprovação do plano.

### Fase 1 — Fundação do projeto

1. Preparar a estrutura frontend/backend conforme diagnóstico.
2. Configurar React, TypeScript e Vite.
3. Configurar Django e Django REST Framework.
4. Configurar variáveis de ambiente locais.
5. Criar `.gitignore` e `.env.example`.
6. Configurar lint, formatadores e testes básicos.
7. Criar uma rota de saúde da API, por exemplo `GET /api/health/`.
8. Documentar como iniciar ambos localmente.

**Critério de conclusão:** frontend e backend iniciam localmente; health check responde; nenhum segredo está no Git.

### Fase 2 — Banco de dados e autenticação

1. Criar o projeto PostgreSQL no Neon.
2. Configurar conexão por variável de ambiente.
3. Criar o modelo de usuário e decidir o fluxo de autenticação.
4. Implementar cadastro, login e logout/expiração de sessão.
5. Proteger endpoints privados.
6. Criar migrations.
7. Testar isolamento dos dados entre dois usuários diferentes.

**Critério de conclusão:** usuário consegue criar conta, autenticar e acessar somente seus próprios dados.

### Fase 3 — Matérias

1. Criar CRUD de matérias.
2. Implementar validações.
3. Criar telas de listagem, criação e edição.
4. Permitir arquivamento ou exclusão conforme regra definida.
5. Cobrir endpoints e componentes com testes.

**Critério de conclusão:** o usuário gerencia suas matérias de ponta a ponta.

### Fase 4 — Tarefas e eventos acadêmicos

1. Implementar tarefas.
2. Implementar provas e trabalhos.
3. Relacionar eventos e tarefas às matérias quando aplicável.
4. Criar filtros por status, matéria e período.
5. Implementar ordenação por data de vencimento.
6. Criar telas e formulários com estados de carregamento, vazio e erro.

**Critério de conclusão:** o usuário registra e acompanha atividades acadêmicas sem perder os dados ao atualizar a página.

### Fase 5 — Calendário

1. Definir visualização inicial (mensal, semanal ou ambas).
2. Consumir eventos e tarefas pela API.
3. Diferenciar visualmente provas, trabalhos e tarefas.
4. Permitir abrir um item para consultar detalhes.
5. Tratar timezone e eventos próximos da meia-noite.

**Critério de conclusão:** os itens cadastrados aparecem na data correta e levam ao respectivo detalhe.

### Fase 6 — Notas e cálculo de médias

1. Confirmar a fórmula acadêmica com o responsável pelo produto.
2. Implementar avaliações e pesos.
3. Implementar o cálculo no backend ou em domínio compartilhado e testável.
4. Exibir média atual e nota necessária, quando matematicamente possível.
5. Tratar ausência de notas, pesos inválidos, nota máxima e disciplinas concluídas.
6. Criar testes unitários para os cenários e casos-limite.

**Critério de conclusão:** os resultados exibidos são explicáveis, reproduzíveis e cobertos por testes. Não apresentar resultado quando faltarem dados essenciais.

### Fase 7 — Dashboard e alertas

1. Criar endpoint agregado do dashboard.
2. Exibir resumo das matérias.
3. Exibir próximas provas e trabalhos.
4. Exibir tarefas pendentes e concluídas.
5. Exibir alertas internos para prazos próximos/vencidos.
6. Evitar cálculos duplicados e consultas excessivas.

**Importante:** para manter o MVP gratuito e simples, começar com alertas dentro do aplicativo. Notificações push, e-mail automático e tarefas agendadas exigem infraestrutura e configuração adicionais; deixar para uma fase posterior.

**Critério de conclusão:** o dashboard apresenta dados reais do usuário autenticado e os alertas seguem a regra documentada.

### Fase 8 — Qualidade e segurança

Checklist mínimo:

- [ ] Todas as rotas privadas exigem autenticação.
- [ ] Toda consulta é filtrada pelo usuário autenticado.
- [ ] Testes impedem acesso cruzado entre usuários.
- [ ] CORS permite somente origens necessárias.
- [ ] Segredos estão em variáveis de ambiente.
- [ ] `DEBUG=False` em produção.
- [ ] `ALLOWED_HOSTS` configurado.
- [ ] HTTPS utilizado nos serviços publicados.
- [ ] Validação no backend, mesmo quando há validação no frontend.
- [ ] Mensagens de erro não revelam segredos ou detalhes internos.
- [ ] Dependências sem uso removidas.
- [ ] Layout utilizável em celular e desktop.
- [ ] Estados de loading, vazio, sucesso e falha implementados.
- [ ] README e instruções de deploy atualizados.

### Fase 9 — Publicação gratuita

**A. Banco (Neon)**
1. Criar projeto PostgreSQL.
2. Guardar a connection string em local seguro.
3. Não colocar a string no repositório.
4. Configurar a variável no serviço backend.

**B. Backend (Render)**
1. Criar Web Service a partir do GitHub.
2. Selecionar a branch principal.
3. Configurar a raiz para `backend`, se o monorepo estiver organizado dessa forma.
4. Configurar comando de build/instalação e comando de inicialização.
5. Configurar variáveis: `SECRET_KEY`, `DEBUG`, `DATABASE_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` e demais necessárias.
6. Executar migrations de maneira controlada.
7. Validar health check e endpoints.
8. Copiar a URL pública da API.

**C. Frontend (Vercel ou Render Static Site)**
1. Importar o mesmo repositório.
2. Definir a raiz como `frontend`.
3. Configurar o comando de build (`npm run build`, conforme `package.json`).
4. Configurar o diretório de saída (`dist`, padrão do Vite).
5. Cadastrar a variável `VITE_API_BASE_URL` com a URL pública da API.
6. Publicar e validar o acesso.
7. Configurar fallback de rotas SPA, se necessário.

**D. Integração**
1. Adicionar o domínio do frontend à lista de origens CORS do backend.
2. Testar cadastro e login pela URL pública.
3. Criar matéria, tarefa, evento e avaliação.
4. Atualizar a página e confirmar persistência.
5. Testar em janela anônima e em dispositivo móvel.
6. Verificar logs dos serviços se houver falha.

### Fase 10 — Entrega e manutenção

1. Atualizar README com links públicos.
2. Registrar variáveis necessárias (somente nomes, nunca valores secretos).
3. Registrar limitações do plano gratuito.
4. Criar procedimento de exportação/backup lógico dos dados.
5. Revisar cotas e avisos de uso dos provedores.
6. Criar tags de versão, por exemplo `v0.1.0`.
7. Manter uma lista de bugs e melhorias.

---

## 8. Estratégia Git e versionamento

### Branches sugeridas

- `main`: versão estável/publicável.
- `develop`: integração do desenvolvimento, se a equipe realmente precisar dela.
- `feat/nome-da-funcionalidade`: novas funcionalidades.
- `fix/nome-do-ajuste`: correções.

Para uma equipe pequena ou projeto individual, é aceitável trabalhar com `main` e branches curtas por funcionalidade, evitando complexidade desnecessária.

### Convenção de commits

Usar Conventional Commits:

```text
feat(subjects): adiciona cadastro de matérias
feat(tasks): implementa conclusão de tarefas
fix(auth): corrige renovação de sessão
test(grades): adiciona cenários de cálculo
docs(readme): documenta execução local
chore(deps): atualiza dependências
```

### Fluxo de trabalho

1. Atualizar a branch de trabalho.
2. Criar branch da tarefa.
3. Implementar uma entrega pequena.
4. Rodar lint e testes.
5. Revisar o diff e remover arquivos/segredos acidentais.
6. Fazer commit com mensagem objetiva.
7. Abrir Pull Request ou integrar conscientemente.
8. Validar deploy de preview, quando disponível.
9. Integrar na `main` somente quando estiver estável.

Nunca commitar `.env`, tokens, senhas, chaves privadas, dumps com dados pessoais ou credenciais do banco.

---

## 9. Interface e experiência do usuário

A identidade visual oficial indica:

- Azul escuro `#1E3A8A`: confiança e conhecimento.
- Roxo `#7C3AED`: tecnologia e inovação.
- Branco `#FFFFFF`: simplicidade e clareza.
- Verde `#22C55E`: conclusão e desempenho positivo.
- Vermelho `#EF4444`: alertas e prazos importantes.

### Navegação sugerida

- Dashboard
- Matérias
- Calendário
- Tarefas
- Notas
- Perfil/Configurações

### Princípios de UX

- Interface responsiva, priorizando também o uso em celular.
- Navegação consistente e simples.
- Formulários curtos, com validação clara.
- Confirmação antes de exclusões.
- Feedback visual após salvar, editar ou concluir.
- Estados vazios com orientação sobre a próxima ação.
- Não preencher telas com dados fictícios em produção.
- Acessibilidade básica: contraste, foco de teclado, labels e textos compreensíveis.

A documentação oficial apresenta a identidade visual, mas não define layout detalhado. A estrutura de navegação acima é uma proposta para o MVP.

---

## 10. Fora do escopo do primeiro MVP

Para evitar que o projeto cresça antes de validar o núcleo:

- Planos pagos e cobrança Premium.
- Integração com portais acadêmicos.
- Sincronização com Google Calendar ou Outlook.
- Notificações push e envio automático de e-mails.
- Aplicativo nativo para Android/iOS.
- Perfis de professores, coordenadores e instituições.
- Inteligência artificial.
- Relatórios avançados e estatísticas históricas.

Esses itens podem entrar no roadmap após testes com estudantes.

---

## 11. Critérios para considerar o MVP pronto

O MVP estará pronto para validação quando:

1. Um estudante conseguir criar uma conta e entrar.
2. Conseguir cadastrar, editar e remover/arquivar matérias.
3. Conseguir criar tarefas, provas e trabalhos.
4. Conseguir visualizar os compromissos no calendário.
5. Conseguir cadastrar notas e visualizar o cálculo conforme a regra definida.
6. Conseguir visualizar um dashboard com dados reais.
7. Conseguir ver alertas internos de prazos.
8. Os dados permanecerem salvos após sair e entrar novamente.
9. Um usuário não conseguir acessar dados de outro usuário.
10. O app estiver acessível por uma URL HTTPS pública.
11. O repositório tiver instruções para executar localmente.
12. Testes essenciais estiverem passando.

---

# 12. Prompt especializado para o Cursor

Copie o prompt abaixo e envie ao Cursor com o repositório aberto. **A primeira execução deve ser de diagnóstico e planejamento, não de implementação.**

```text
Você atuará como Tech Lead, Arquiteto de Software e Engenheiro Full Stack responsável por planejar a construção do UniTask.

CONTEXTO DO PRODUTO
O UniTask é um aplicativo web de gerenciamento da vida acadêmica universitária. Sua proposta é centralizar matérias, provas, trabalhos, tarefas, calendário, notas, médias e acompanhamento acadêmico.

O documento oficial do produto define estas funcionalidades:
1. Cadastro de matérias.
2. Calendário de provas e trabalhos.
3. Alertas inteligentes de prazos.
4. Cálculo automático de médias e nota necessária para aprovação.
5. Dashboard acadêmico.
6. Gerenciamento de tarefas.

O documento também menciona modalidade gratuita e Premium, mas o primeiro MVP deve implementar somente as funcionalidades essenciais gratuitas.

OBJETIVO TÉCNICO
Construir uma aplicação web full stack, versionada em Git e publicada por uma URL pública, utilizando serviços gratuitos dentro de suas cotas e termos de uso.

STACK PREFERENCIAL A AVALIAR
- Frontend: React + TypeScript + Vite.
- Backend: Python + Django + Django REST Framework.
- Banco: PostgreSQL hospedado no Neon Free.
- Frontend hosting: Vercel Hobby (somente se o uso estiver de acordo com os termos) ou Render Static Site.
- Backend hosting: Render Web Service Free.
- Versionamento: Git e GitHub.

Não introduza tecnologias adicionais sem justificar o benefício. Não misture Supabase como backend gerenciado com Django sem uma decisão arquitetural explícita.

REGRAS DE ATUAÇÃO
1. Antes de qualquer alteração, inspecione integralmente o repositório e identifique sua estrutura, tecnologias, arquivos, dependências e estado do Git.
2. Não apague, sobrescreva ou reorganize arquivos existentes sem explicar a necessidade.
3. Não invente regras de negócio que o documento não especifica.
4. Quando faltar uma definição — especialmente fórmula de aprovação, pesos, recuperação, regras de alertas e relacionamentos — registre a dúvida e proponha opções para decisão.
5. Priorize simplicidade, segurança, legibilidade, manutenção e custo zero.
6. Não coloque segredos, tokens, senhas ou connection strings no código ou no Git.
7. Toda entidade acadêmica deve respeitar o isolamento por usuário.
8. O frontend nunca deve acessar o PostgreSQL diretamente.
9. Toda regra importante deve ser validada no backend.
10. Não implemente todas as funcionalidades de uma vez. Trabalhe por fases pequenas e verificáveis.
11. Não execute deploy, crie contas externas, altere configurações de serviços ou faça operações irreversíveis sem autorização explícita.
12. Não afirme que um serviço é gratuito sem conferir seus limites e termos atuais. Registre as limitações relevantes.

FASE ATUAL — SOMENTE DIAGNÓSTICO E PLANEJAMENTO
Nesta primeira execução, NÃO comece a implementar a aplicação.

Entregue:

A. DIAGNÓSTICO DO REPOSITÓRIO
- Estrutura atual de diretórios.
- Tecnologias e versões identificadas.
- Dependências existentes.
- O que já está implementado.
- Problemas, riscos e itens que precisam de decisão.
- O que deve ser preservado.

B. ARQUITETURA PROPOSTA
- Diagrama textual frontend → API → banco.
- Responsabilidades de cada camada.
- Estratégia de autenticação.
- Estratégia de isolamento de dados por usuário.
- Estratégia de variáveis de ambiente.
- Estratégia de deploy gratuito.
- Limitações e riscos dos serviços escolhidos.

C. REQUISITOS FUNCIONAIS
Organize os seis módulos oficiais em requisitos menores, com critérios de aceite.
Separe claramente:
- Requisitos presentes no documento.
- Decisões ainda pendentes.
- Sugestões técnicas para o MVP.

D. MODELO DE DADOS
Proponha entidades, campos, relacionamentos, constraints e índices.
Considere inicialmente User, Subject, AcademicEvent, Task, Assessment e Notification.
Justifique cada relacionamento e indique quais campos ainda dependem de decisão de produto.

E. CONTRATO DA API
Proponha endpoints REST, métodos HTTP, autenticação, filtros, paginação e principais respostas de erro.
Considere documentação OpenAPI/Swagger.

F. ESTRUTURA DO FRONTEND
Proponha rotas, módulos, componentes compartilhados, gerenciamento de estado e camada de comunicação com a API.

G. PLANO DE EXECUÇÃO
Monte um roadmap sequencial com:
- Fase.
- Objetivo.
- Atividades.
- Arquivos/módulos impactados.
- Dependências.
- Testes necessários.
- Critério de conclusão.

H. PLANO DE PUBLICAÇÃO
Descreva como publicar PostgreSQL no Neon, API no Render e frontend na Vercel ou Render Static Site.
Inclua variáveis necessárias, comandos de build/start, migrations, CORS, HTTPS e health check.
Não exponha valores secretos.

I. ESTRATÉGIA DE VERSIONAMENTO
Proponha branches, commits, Pull Requests, tags e proteção de segredos.

J. PRIMEIRA SPRINT
Liste somente as tarefas da primeira sprint, em ordem de execução, com entregas pequenas e critérios de aceite.

FORMATO DA RESPOSTA
- Escreva em português do Brasil.
- Seja técnico, objetivo e detalhado.
- Use Markdown, tabelas e diagramas textuais quando ajudarem.
- Diferencie fatos observados no repositório de recomendações.
- Aponte riscos e decisões pendentes.
- Não gere uma implementação antes de apresentar o diagnóstico e o plano.

APÓS A APROVAÇÃO
Quando eu aprovar o planejamento, execute uma fase por vez.
Antes de cada fase, apresente o escopo e os arquivos que pretende alterar.
Ao concluir, rode os testes aplicáveis, informe o resultado, liste os arquivos alterados e atualize a documentação.
Não avance automaticamente para a fase seguinte sem minha confirmação.
```

---

## 13. Como começar na prática

A sequência recomendada é:

1. Abrir o repositório do UniTask no Cursor.
2. Colocar o PDF oficial e este plano na pasta `docs/` do projeto, se desejar manter a documentação junto ao código.
3. Colar o prompt da seção 12 no Cursor.
4. Pedir que ele faça somente o diagnóstico.
5. Revisar o plano gerado e resolver as decisões pendentes.
6. Aprovar a primeira sprint.
7. Implementar, testar e versionar cada fase.
8. Publicar primeiro uma versão mínima e depois evoluir os módulos.

**Minha recomendação principal:** não comece pela publicação nem pelo visual completo. Primeiro faça o fluxo mínimo funcionar: cadastro/login → matéria → tarefa/evento → persistência no PostgreSQL. Depois avance para calendário, notas e dashboard. Assim, você valida a arquitetura cedo e reduz o risco de construir várias telas sobre uma estrutura de dados inadequada.

---

## 14. Referências oficiais para conferir limites e configuração

- Vercel Hobby: https://vercel.com/docs/plans/hobby
- Vercel limites: https://vercel.com/docs/limits
- Render serviços gratuitos: https://render.com/docs/free
- Neon preços e limites: https://neon.com/pricing
- Supabase preços (alternativa): https://supabase.com/pricing
- Django: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
- Vite: https://vite.dev/guide/
- GitHub Docs: https://docs.github.com/

> **Nota sobre custo zero:** “gratuito” significa permanecer dentro das cotas, restrições e termos dos planos gratuitos. Isso não garante disponibilidade contínua, backups gerenciados ou capacidade para muitos usuários. Para dados reais, manter exportações periódicas e nunca depender de uma única cópia.
