:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/solution/crm/index).
:::

# Solução NocoBase CRM 2.0

> Sistema de gestão de vendas modular baseado na plataforma low-code NocoBase, com tomada de decisão assistida por funcionários de IA

## 1. Contexto

### Desafios enfrentados pelas equipes de vendas

As equipes de vendas das empresas frequentemente encontram estes problemas em suas operações diárias: a qualidade inconsistente dos leads dificulta a triagem rápida, os acompanhamentos de oportunidades são facilmente esquecidos, as informações dos clientes estão dispersas em e-mails e em vários sistemas, as previsões de vendas dependem inteiramente da experiência e os processos de aprovação de orçamentos não são padronizados.

**Cenários típicos:** Avaliação e atribuição rápida de leads, monitoramento da saúde das oportunidades, alertas de rotatividade de clientes, aprovação de orçamentos em vários níveis, associação de e-mails com clientes/oportunidades.

### Público-alvo

Equipes de vendas B2B, vendas baseadas em projetos e vendas de comércio exterior em pequenas, médias e grandes empresas. Essas empresas estão atualizando a gestão de Excel/e-mail para uma gestão sistematizada e possuem altos requisitos de segurança para os dados dos clientes.

### Deficiências das soluções existentes

- **Custo alto**: Salesforce/HubSpot cobram por usuário, o que é difícil de arcar para pequenas e médias empresas
- **Sobrecarga de funções**: CRMs de grande porte possuem funções excessivas e altos custos de aprendizado; menos de 20% das funções são realmente utilizadas
- **Dificuldade de customização**: Sistemas SaaS são difíceis de adaptar aos processos de negócios da própria empresa; até para alterar um campo é necessário seguir um processo formal
- **Segurança de dados**: Dados de clientes armazenados em servidores de terceiros representam riscos de conformidade e segurança
- **Alto custo de desenvolvimento próprio**: O desenvolvimento tradicional tem ciclos longos e altos custos de manutenção, dificultando ajustes rápidos quando o negócio muda

---

## 2. Vantagens Diferenciadas

**Principais produtos do mercado:** Salesforce, HubSpot, Zoho CRM, 纷享销客 (Fxiaoke), Odoo CRM, SuiteCRM, etc.

**Vantagens ao nível da plataforma:**

- **Prioridade de configuração**: Modelos de dados, layouts de página e fluxos de trabalho podem ser configurados via UI, sem necessidade de escrever código
- **Construção rápida low-code**: Mais rápido que o desenvolvimento próprio e mais flexível que o SaaS
- **Módulos desmontáveis**: Cada módulo é projetado de forma independente e pode ser reduzido conforme a necessidade; o mínimo viável requer apenas os módulos de Cliente e Oportunidade

**O que os CRMs tradicionais não conseguem fazer ou têm custos altíssimos:**

- **Soberania de dados**: Implantação auto-hospedada, os dados dos clientes são armazenados em servidores próprios, atendendo aos requisitos de conformidade
- **Integração nativa de funcionários de IA**: Funcionários de IA profundamente incorporados nas páginas de negócios, percebendo automaticamente o contexto dos dados, em vez de ser apenas "um botão de IA"
- **Todo o design pode ser replicado**: Os usuários podem expandir a solução por conta própria com base em modelos, sem depender do fornecedor

---

## 3. Princípios de Design

- **Baixo custo cognitivo**: Interface simples, com funções principais claras à primeira vista
- **Negócio antes da tecnologia**: Foco em cenários de vendas, não em exibicionismo técnico
- **Evoluível**: Suporte para lançamento em fases e melhoria gradual
- **Configuração primeiro**: O que puder ser configurado, não escreva código
- **Colaboração humano-IA**: Funcionários de IA auxiliam na tomada de decisões, em vez de substituir o julgamento da equipe de vendas

---

## 4. Visão Geral da Solução

### Capacidades Principais

- **Gestão de fluxo completo**: Lead → Oportunidade → Orçamento → Pedido → Sucesso do Cliente
- **Módulos ajustáveis**: Versão completa com 7 módulos, o mínimo viável requer apenas 2 módulos principais
- **Suporte multimoeda**: Conversão automática entre CNY/USD/EUR/GBP/JPY
- **Assistência de IA**: Pontuação de leads, previsão de taxa de ganho e sugestões de próximas ações

### Módulos Principais

| Módulo | Obrigatório | Descrição | Assistência de IA |
|------|:----:|------|--------|
| Gestão de Clientes | ✅ | Arquivos de clientes, contatos, hierarquia de clientes | Avaliação de saúde, alerta de rotatividade |
| Gestão de Oportunidades | ✅ | Funil de vendas, progressão de estágios, registros de atividades | Previsão de taxa de ganho, sugestões de próximos passos |
| Gestão de Leads | - | Entrada de leads, fluxo de status, rastreamento de conversão | Pontuação inteligente |
| Gestão de Orçamentos | - | Multimoeda, gestão de versões, fluxo de aprovação | - |
| Gestão de Pedidos | - | Geração de pedidos, rastreamento de pagamentos | - |
| Gestão de Produtos | - | Catálogo de produtos, categorias, preços escalonados | - |
| Integração de E-mail | - | Envio e recebimento de e-mails, associação com CRM | Análise de sentimento, geração de resumos |

### Ajuste da Solução

- **Versão Completa** (todos os 7 módulos): Para equipes de vendas B2B com processos completos
- **Versão Padrão** (Cliente + Oportunidade + Orçamento + Pedido + Produto): Gestão de vendas para pequenas e médias empresas
- **Versão Leve** (Cliente + Oportunidade): Rastreamento simples de clientes e oportunidades
- **Versão de Comércio Exterior** (Cliente + Oportunidade + Orçamento + E-mail): Para empresas do tipo comércio exterior

---

## 5. Funcionários de IA

O sistema CRM vem pré-configurado com 5 funcionários de IA, profundamente incorporados nas páginas de negócios. Diferente das ferramentas de chat de IA comuns, eles podem identificar automaticamente os dados que você está visualizando no momento — seja uma lista de leads, detalhes de uma oportunidade ou registros de e-mail — sem a necessidade de copiar e colar manualmente.

**Como usar**: Clique na bola flutuante de IA no canto inferior direito da página ou clique diretamente no ícone de IA ao lado de um bloco para chamar o funcionário correspondente. Você também pode predefinir tarefas comuns para cada funcionário para acioná-las com um clique na próxima vez.

| Funcionário | Responsabilidade | Uso Típico no CRM |
|------|------|-----------------|
| **Viz** | Analista de Insights | Análise de canais de leads, tendências de vendas, saúde do pipeline |
| **Ellis** | Especialista em E-mail | Redação de e-mails de acompanhamento, geração de resumos de comunicação |
| **Lexi** | Assistente de Tradução | E-mails multilíngues, comunicação com clientes de comércio exterior |
| **Dara** | Especialista em Visualização | Configuração de relatórios e gráficos, construção de painéis |
| **Orin** | Planejador de Tarefas | Prioridades diárias, sugestões de próximas ações |

### Valor de Negócio dos Funcionários de IA

| Dimensão de Valor | Efeito Específico |
|----------|----------|
| Aumento de Eficiência | Pontuação de leads concluída automaticamente, economizando triagem manual; redação de e-mails de acompanhamento com um clique |
| Empoderamento da Equipe | Análise de dados de vendas sempre ao seu alcance, sem esperar que a equipe de dados gere relatórios |
| Qualidade da Comunicação | E-mails profissionais + polimento por IA, comunicação multilíngue sem barreiras para equipes de comércio exterior |
| Suporte à Decisão | Julgamento de taxa de ganho em tempo real e sugestões de próximos passos, reduzindo a perda de oportunidades por falta de acompanhamento |

---

## 6. Destaques

**Módulos desmontáveis** — Cada módulo é projetado de forma independente e pode ser ligado ou desligado individualmente. A configuração mínima requer apenas os módulos principais de Cliente + Oportunidade; use o que for suficiente, sem obrigatoriedade de usar tudo.

**Ciclo de vendas completo** — Lead → Oportunidade → Orçamento → Pedido → Pagamento → Sucesso do Cliente, com dados integrados em toda a cadeia, sem necessidade de alternar entre vários sistemas.

**Integração nativa de funcionários de IA** — Não é apenas "adicionar um botão de IA", mas sim 5 funcionários de IA integrados em cada página de negócio, obtendo automaticamente o contexto dos dados atuais para acionar análises e sugestões com um clique.

**Integração profunda de e-mail** — E-mails associados automaticamente a clientes, contatos e oportunidades; suporte para Gmail e Outlook, com vários modelos de e-mail em inglês cobrindo cenários comuns de vendas.

**Suporte multimoeda para comércio exterior** — Suporte para CNY/USD/EUR/GBP/JPY, com configuração de conversão de taxa de câmbio, adequado para equipes de vendas internacionais e multinacionais.

---

## 7. Instalação e Uso

Use a função de gerenciamento de migração do NocoBase para migrar o pacote do aplicativo CRM para o ambiente de destino com um clique.

**Pronto para usar:** Coleções, fluxos de trabalho e painéis pré-configurados, visões de múltiplos papéis (Gerente de Vendas/Representante de Vendas/Executivo), 37 modelos de e-mail cobrindo cenários comuns de vendas.

---

## 8. Planejamento Futuro

- **Automação de Oportunidades**: A progressão de estágios aciona notificações, alertas automáticos para oportunidades estagnadas, reduzindo o monitoramento manual
- **Fluxos de Trabalho de Aprovação**: Fluxo de trabalho de aprovação de orçamentos em vários níveis, com suporte para aprovação em dispositivos móveis
- **Automação de IA**: Funcionários de IA incorporados em fluxos de trabalho, com suporte para execução automática em segundo plano, realizando pontuação de leads e análise de oportunidades sem supervisão
- **Adaptação Móvel**: Interface amigável para dispositivos móveis, para acompanhar clientes a qualquer hora e em qualquer lugar
- **Suporte Multi-inquilino**: Expansão horizontal de múltiplos espaços/aplicativos, distribuindo para diferentes equipes de vendas operarem de forma independente

---

*Versão do documento: v2.0 | Data de atualização: 06-02-2026*