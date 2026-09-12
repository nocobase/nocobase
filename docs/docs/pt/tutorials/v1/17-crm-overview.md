# Visão Geral das Funcionalidades do CRM Sales Cloud

Neste capítulo, vamos dividir o sistema em vários módulos por funcionalidade de negócio, descrevendo em detalhes as funcionalidades centrais de cada módulo e a estrutura de dados correspondente. A solução não foca apenas no fluxo suave do negócio, mas também considera a racionalidade do armazenamento de dados e a extensibilidade do sistema.

---

## 1. Gestão de Leads

### Visão geral da funcionalidade

O módulo de gestão de leads é responsável por coletar e gerenciar informações de potenciais clientes. O sistema suporta entrada de leads por diversos canais (site, telefone, e-mail) e fornece atualizações de status, registros de follow-up e observações. Na conversão de lead, o sistema detecta automaticamente dados duplicados, garantindo que leads adequados sejam convertidos em clientes, contatos e oportunidades.

### Tabelas relacionadas

- **Leads (tabela de leads)**
  Armazena informações básicas dos leads: nome, contato, fonte, status atual e observações. Registra a data de criação e o histórico de atualizações de cada lead, facilitando estatísticas e análises.

---

## 2. Gestão de Clientes e Contatos

### Visão geral da funcionalidade

Este módulo ajuda a criar e manter cadastros de clientes. As empresas podem registrar nome da empresa, setor, endereço e outras informações-chave do cliente, e gerenciar informações de contatos relacionadas (nome, cargo, telefone, e-mail). O sistema suporta associações um-para-muitos ou muitos-para-muitos entre clientes e contatos, garantindo a integridade e atualização sincronizada das informações.

### Tabelas relacionadas

- **Accounts (tabela de clientes)**
  Registra os cadastros detalhados dos clientes, incluindo informações básicas da empresa e outros dados de negócio.
- **Contacts (tabela de contatos)**
  Armazena informações pessoais relacionadas aos clientes, conectadas à tabela de clientes via FK, garantindo a coerência dos dados.

### Fluxograma de conversão de lead

![20250225211802](https://static-docs.nocobase.com/20250225211802.png)

- Entrada de lead → Follow-up de lead (atualização de status) → Validação → Conversão em cliente, contato e oportunidade

---

## 3. Gestão de Oportunidades

### Visão geral da funcionalidade

O módulo de gestão de oportunidades foca em transformar leads convertidos ou clientes existentes em oportunidades de venda. Os usuários podem registrar a data prevista de fechamento, etapa atual, valor estimado e probabilidade de sucesso. Ao mesmo tempo, o sistema suporta gerenciamento dinâmico de etapas de venda, e ao perder uma oportunidade, registra o motivo detalhado, facilitando otimizações futuras da estratégia comercial. Além disso, o módulo permite associar vários produtos a uma única oportunidade, calculando o valor total automaticamente.

### Tabelas relacionadas

- **Opportunities (tabela de oportunidades)**
  Registra informações detalhadas de cada oportunidade: data de fechamento, etapa, valor estimado, etc.
- **OpportunityLineItem (tabela de itens da oportunidade)**
  Armazena informações específicas de produto associadas à oportunidade, incluindo ID do produto, quantidade, preço unitário, desconto, etc., com suporte a cálculo automático de valor.

### Etapas de conversão

- Criação da oportunidade → Gestão (atualização de etapa) → Geração de cotação → Aprovação do cliente → Geração do pedido de venda → Execução do pedido e atualização de status

---

## 4. Gestão de Produtos e Lista de Preços

### Visão geral da funcionalidade

Este módulo gerencia informações de produtos e estratégias de preço. O sistema permite cadastrar informações básicas do produto: código, nome, descrição, estoque, preço, etc., e suporta a criação de vários modelos de preço. Ao associar produtos a listas de preços, o usuário pode gerenciar com flexibilidade as necessidades de precificação para diferentes mercados e grupos de clientes.

### Tabelas relacionadas

- **Products (tabela de produtos)**
  Armazena informações detalhadas de todos os produtos, fornecendo dados básicos para cotação e geração de pedidos.
- **PriceBooks (tabela de listas de preços)**
  Gerencia diferentes modelos de preço e produtos associados, suportando ajustes dinâmicos da estratégia de precificação conforme as necessidades.

---

## 5. Gestão de Cotações

### Visão geral da funcionalidade

O módulo de gestão de cotações gera cotações formais a partir de oportunidades existentes, registrando validade, desconto, taxa e valor total da cotação. O sistema possui fluxo de aprovação embutido, permitindo que a gerência revise e ajuste cotações; cada cotação pode conter vários itens de produto, garantindo cálculos precisos.

### Tabelas relacionadas

- **Quotes (tabela de cotações)**
  Registra informações básicas da cotação: oportunidade associada, validade, desconto, taxa e status geral.
- **QuoteLineItems (tabela de itens da cotação)**
  Armazena dados detalhados de cada produto da cotação, calculando automaticamente os valores individuais e total.

---

## 6. Gestão de Pedidos de Venda

### Visão geral da funcionalidade

O módulo de gestão de pedidos converte cotações aprovadas em pedidos de venda, e acompanha todo o processo do pedido: criação até conclusão. Os usuários podem ver em tempo real o status do pedido, registros de aprovação e logística e expedição, controlando melhor o progresso de execução.

### Tabelas relacionadas

- **SalesOrders (tabela de pedidos de venda)**
  Registra informações detalhadas do pedido: cotação associada, status, registros de aprovação, status de expedição e data de criação.

---

## 7. Gestão de Atividades

### Visão geral da funcionalidade

O módulo de gestão de atividades ajuda a equipe de vendas a gerenciar o trabalho diário, incluindo tarefas, reuniões e ligações telefônicas. O sistema permite registrar o conteúdo específico da atividade, participantes e observações, e fornece agendamento e lembretes, garantindo que tudo aconteça conforme planejado.

### Tabelas relacionadas

- **Activities (tabela de atividades)**
  Armazena registros de tarefas, reuniões e ligações, incluindo tipo de atividade, data, participantes e cliente ou oportunidade relacionados.

---

## 8. Relatórios e Análise de Dados

### Visão geral da funcionalidade

Este módulo, através de estatísticas multidimensionais e gráficos, ajuda a empresa a entender em tempo real o desempenho de vendas e a conversão de negócio. O sistema suporta geração de funil de vendas, análise de taxas de conversão e relatórios de desempenho, oferecendo suporte à tomada de decisão.

### Observação

Embora o módulo de relatórios e análise de dados não tenha tabelas específicas, ele depende dos dados armazenados nos módulos anteriores, agregando e analisando para fornecer feedback em tempo real e previsão de tendências.

---

## 9. Gestão de Campanhas de Marketing (Módulo opcional)

### Visão geral da funcionalidade

Como funcionalidade auxiliar, o módulo de gestão de campanhas de marketing planeja e acompanha campanhas de marketing. O sistema pode registrar planejamento, orçamento, processo de execução e avaliação de resultados, calculando taxa de conversão de leads e ROI, fornecendo suporte de dados ao marketing.

### Observação

A estrutura de dados deste módulo pode ser estendida conforme necessidades reais; atualmente foca em registrar a execução das campanhas de marketing, complementando os dados do módulo de gestão de leads.
