# UniTask — Requisitos do produto (MVP)

## Visão

Centralizar a rotina acadêmica do estudante: matérias, provas, trabalhos, tarefas, calendário, notas, médias e dashboard.

## Escopo do MVP (gratuito)

| Módulo | Entrega |
|---|---|
| Conta | Cadastro, login, logout, renovação de token, perfil básico |
| Matérias | CRUD + arquivar |
| Eventos acadêmicos | Prova, trabalho e outros, vinculados a matéria (opcional) |
| Tarefas | CRUD, concluir/reabrir; matéria opcional |
| Calendário | Visualização mensal com eventos e tarefas |
| Notas | Avaliações com pesos opcionais; média e nota necessária |
| Dashboard | Próximos prazos, tarefas, resumo de matérias |
| Alertas | Avisos in-app para prazos próximos (3 dias) e vencidos |

## Fora do MVP

- Premium / cobrança
- Push e e-mail automático
- Integração com portais acadêmicos ou Google Calendar
- App nativo
- Perfis de professor/instituição
- IA e relatórios avançados

## Critérios de aceite do MVP

1. Estudante cria conta e entra.
2. Gerencia matérias.
3. Cria tarefas, provas e trabalhos.
4. Vê compromissos no calendário.
5. Cadastra notas e vê cálculo conforme regra documentada.
6. Vê dashboard com dados reais.
7. Vê alertas internos de prazos.
8. Dados persistem após logout/login.
9. Usuário A não acessa dados do usuário B.
10. App acessível por URL HTTPS pública.
11. README com execução local.
12. Testes essenciais passando.

## Identidade visual

| Cor | Hex | Uso |
|---|---|---|
| Azul escuro | `#1E3A8A` | Confiança / marca |
| Roxo | `#7C3AED` | Tecnologia / destaques |
| Branco | `#FFFFFF` | Fundo / clareza |
| Verde | `#22C55E` | Conclusão / sucesso |
| Vermelho | `#EF4444` | Alertas / prazos |

## Navegação

Dashboard · Matérias · Calendário · Tarefas · Notas · Perfil
