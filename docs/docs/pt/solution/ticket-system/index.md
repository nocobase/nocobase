:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/solution/ticket-system/index).
:::

# Introdução à Solução de Chamados

> **Dica**: Esta é uma versão prévia inicial. As funcionalidades ainda estão sendo aprimoradas e estamos trabalhando continuamente em melhorias. Feedbacks são bem-vindos!

## 1. Contexto (Por que?)

### Problemas de setor / cargo / gestão resolvidos

As empresas enfrentam diversos tipos de solicitações de serviço em suas operações diárias: manutenção de equipamentos, suporte de TI, reclamações de clientes, consultas, etc. Essas solicitações vêm de fontes dispersas (sistemas de CRM, engenheiros de campo, e-mails, formulários públicos, etc.), possuem diferentes fluxos de trabalho de processamento e carecem de mecanismos unificados de rastreamento e gestão.

**Exemplos de cenários de negócios típicos:**

- **Manutenção de Equipamentos**: A equipe de pós-venda lida com solicitações de reparo de equipamentos, precisando registrar informações específicas do dispositivo, como números de série, códigos de falha e peças de reposição.
- **Suporte de TI**: O departamento de TI lida com solicitações de funcionários internos para redefinição de senhas, instalações de software e problemas de rede.
- **Reclamações de Clientes**: A equipe de atendimento ao cliente lida com reclamações de múltiplos canais; alguns clientes emocionalmente exaltados precisam de atendimento prioritário.
- **Autoatendimento do Cliente**: Os clientes finais desejam enviar solicitações de serviço de forma conveniente e acompanhar o progresso do processamento.

### Perfil do Usuário-Alvo

| Dimensão | Descrição |
|----------|-----------|
| Tamanho da Empresa | De PMEs a grandes empresas com necessidades substanciais de atendimento ao cliente |
| Estrutura de Cargos | Equipes de atendimento ao cliente, suporte de TI, equipes de pós-venda, gestão de operações |
| Maturidade Digital | De iniciante a intermediária, buscando atualizar da gestão por Excel/e-mail para uma gestão sistematizada |

### Pontos de dor das soluções atuais do mercado

- **Custo Alto / Customização Lenta**: Sistemas de chamados SaaS são caros e os ciclos de desenvolvimento personalizado são longos.
- **Fragmentação do Sistema, Silos de Dados**: Dados de negócios dispersos em diferentes sistemas dificultam a unificação da análise e da tomada de decisão.
- **Mudanças Rápidas no Negócio, Difícil Evolução**: Quando os requisitos de negócio mudam, os sistemas são difíceis de ajustar rapidamente.
- **Resposta de Serviço Lenta**: Solicitações que fluem entre diferentes sistemas não podem ser despachadas prontamente.
- **Processo Opaco**: Os clientes não conseguem acompanhar o progresso do chamado; consultas frequentes aumentam a pressão no atendimento ao cliente.
- **Qualidade Difícil de Garantir**: A falta de monitoramento de SLA impede que atrasos e feedbacks negativos gerem alertas a tempo.

---

## 2. Referência e Comparativo (Benchmark)

### Principais produtos do mercado

- **SaaS**: Salesforce, Zendesk, Odoo, etc.
- **Sistemas Personalizados / Sistemas Internos**

### Dimensões de Comparação

- Cobertura de funcionalidades
- Flexibilidade
- Extensibilidade
- Abordagem de uso de IA

### Diferenciais da Solução NocoBase

**Vantagens ao nível da plataforma:**

- **Prioridade à Configuração**: Das tabelas de dados subjacentes aos tipos de negócio, SLA e roteamento por habilidades — tudo é gerenciado via configuração.
- **Desenvolvimento Rápido em Low-Code**: Mais rápido que o desenvolvimento personalizado e mais flexível que o SaaS.

**O que os sistemas tradicionais não conseguem fazer ou custam muito caro:**

- **Integração Nativa de IA**: Aproveita os plugins de IA do NocoBase para classificação inteligente, auxílio no preenchimento de formulários e recomendações de conhecimento.
- **Todos os Designs podem ser Replicados pelos Usuários**: Os usuários podem estender a solução com base em modelos.
- **Arquitetura de Dados em T**: Tabela principal + tabelas de extensão de negócio; adicionar novos tipos de negócio requer apenas a adição de tabelas de extensão.

---

## 3. Princípios de Design

- **Baixo Custo Cognitivo**
- **O Negócio antes da Tecnologia**
- **Evolutivo, não uma conclusão única**
- **Configuração Primeiro, Código como Reserva (Fallback)**
- **Colaboração Humano-IA, não a IA substituindo humanos**
- **Todos os designs devem ser replicáveis pelos usuários**

---

## 4. Visão Geral da Solução (Solution Overview)

### Introdução Resumida

Uma plataforma central de chamados universal construída sobre a plataforma low-code NocoBase, alcançando:

- **Entrada Unificada**: Integração de múltiplas fontes, processamento padronizado.
- **Distribuição Inteligente**: Classificação assistida por IA, atribuição com balanceamento de carga.
- **Negócios Polimórficos**: Tabela principal central + tabelas de extensão de negócio, extensão flexível.
- **Feedback de Ciclo Fechado**: Monitoramento de SLA, avaliações de clientes, acompanhamento de feedbacks negativos.

### Fluxo de Processamento de Chamados

```
Entrada Multi-fonte → Pré-processamento/Análise de IA → Atribuição Inteligente → Execução Manual → Ciclo de Feedback
      ↓                          ↓                          ↓                    ↓                ↓
 Verif. Duplicidade      Reconhecimento de Intenção     Match de Habilidades   Fluxo de Status   Avaliação de Satisfação
                         Análise de Sentimento          Balanceamento de Carga Monitoramento SLA Acompanhamento de Críticas
                         Resposta Automática            Gestão de Filas        Comunicação       Arquivamento de Dados
```

### Lista de Módulos Principais

| Módulo | Descrição |
|--------|-------------|
| Entrada de Chamados | Formulários públicos, portal do cliente, registro pelo agente, API/Webhook, análise de e-mail |
| Gestão de Chamados | CRUD de chamados, fluxo de status, atribuição/transferência, comunicação por comentários, logs de operação |
| Extensão de Negócio | Tabelas de extensão para manutenção de equipamentos, suporte de TI, reclamações de clientes e outros |
| Gestão de SLA | Configuração de SLA, alertas de tempo esgotado, escalonamento de atrasos |
| Gestão de Clientes | Tabela principal de clientes, gestão de contatos, portal do cliente |
| Sistema de Avaliação | Pontuação multidimensional, etiquetas rápidas, NPS, alertas de feedback negativo |
| Assistência de IA | Classificação de intenção, análise de sentimento, recomendação de conhecimento, auxílio em respostas, polimento de tom |

### Exibição da Interface Principal

![ticketing-imgs-2026-01-01-00-46-12](https://static-docs.nocobase.com/ticketing-imgs-2026-01-01-00-46-12.jpg)

---

## 5. Funcionários de IA (AI Employee)

### Tipos e Cenários de Funcionários de IA

- **Assistente de Atendimento**, **Assistente de Vendas**, **Analista de Dados**, **Auditor**
- Auxiliando humanos, não os substituindo

### Quantificação de Valor do Funcionário de IA

Nesta solução, os funcionários de IA podem:

| Dimensão de Valor | Efeitos Específicos |
|-------------------|---------------------|
| Aumentar a Eficiência | A classificação automática reduz o tempo de triagem manual em mais de 50%; recomendações de conhecimento aceleram a resolução de problemas |
| Reduzir Custos | Respostas automáticas para perguntas simples, reduzindo a carga de trabalho do atendimento humano |
| Capacitar Funcionários | Alertas de emoção ajudam o atendente a se preparar antecipadamente; o polimento de respostas melhora a qualidade da comunicação |
| Melhorar a Satisfação | Resposta mais rápida, atribuição mais precisa e respostas mais profissionais |

---

## 6. Destaques (Highlights)

### 1. Arquitetura de Dados em T

- Todos os chamados compartilham a tabela principal com lógica de fluxo unificada.
- Tabelas de extensão de negócio carregam campos específicos de cada tipo, permitindo extensão flexível.
- Adicionar novos tipos de negócio requer apenas adicionar tabelas de extensão, sem afetar o fluxo principal.

### 2. Ciclo de Vida Completo do Chamado

- Novo → Atribuído → Processando → Pendente → Resolvido → Fechado.
- Suporta cenários complexos como transferência, devolução e reabertura.
- Cronometragem de SLA precisa, considerando pausas em estado pendente.

### 3. Integração Unificada Multicanal

- Formulários públicos, portal do cliente, API, e-mail, registro manual pelo agente.
- Verificação de idempotência para evitar a criação de duplicatas.

### 4. Integração Nativa de IA

- Não é apenas "adicionar um botão de IA", mas sim integrá-la em cada etapa.
- Reconhecimento de intenção, análise de sentimento, recomendação de conhecimento e polimento de respostas.

---

## 7. Instalação e Implantação

### Como instalar e usar

Use a gestão de migração para migrar e integrar várias aplicações parciais em outras aplicações.

---

## 8. Roadmap (Atualizado Continuamente)

- **Incorporação no Sistema**: Suporte para incorporar o módulo de chamados em vários sistemas de negócio como ERP, CRM, etc.
- **Interconexão de Chamados**: Integração de chamados de sistemas upstream/downstream e callbacks de status para colaboração entre sistemas.
- **Automação por IA**: Funcionários de IA incorporados em fluxos de trabalho, suportando execução automática em segundo plano para processamento autônomo.
- **Suporte a Multi-inquilino (Multi-tenancy)**: Escalonamento horizontal via arquitetura multi-espaço/multi-app, permitindo a distribuição para diferentes equipes de serviço para operação independente.
- **Base de Conhecimento RAG**: Vetorização automática de todos os dados (chamados, clientes, produtos, etc.) para recuperação inteligente e recomendações de conhecimento.
- **Suporte Multi-idioma**: Interface e conteúdo com suporte a vários idiomas, permitindo a colaboração de equipes transfronteiriças/regionais.