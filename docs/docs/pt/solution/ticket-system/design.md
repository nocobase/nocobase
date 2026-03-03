:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/solution/ticket-system/design).
:::

# Design Detalhado da Solução de Chamados

> **Versão**: v2.0-beta

> **Data de Atualização**: 05-01-2026

> **Status**: Versão de Pré-visualização

## 1. Visão Geral do Sistema e Filosofia de Design

### 1.1 Posicionamento do Sistema

Este sistema é uma **plataforma inteligente de gestão de chamados impulsionada por IA**, construída sobre a plataforma low-code NocoBase. O objetivo central é:

```
Permitir que o atendimento ao cliente se concentre em resolver problemas, e não em operações de processo tediosas
```

### 1.2 Filosofia de Design

#### Filosofia Um: Arquitetura de Dados em Forma de T (T-Shaped)

**O que é a Arquitetura em T?**

Inspirada no conceito de "profissionais em T" — amplitude horizontal + profundidade vertical:

- **Horizontal (Tabela Principal)**: Abrange capacidades universais para todos os tipos de negócio — número do chamado, status, responsável, SLA e outros campos essenciais.
- **Vertical (Tabelas de Extensão)**: Campos especializados para tipos de negócio específicos — reparo de equipamentos possui números de série, reclamações possuem planos de compensação.

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-50-45.png)

**Por que este design?**

| Abordagem Tradicional | Arquitetura em T |
|-----------------------|------------------|
| Uma tabela por tipo de negócio, campos duplicados | Campos comuns unificados, campos de negócio estendidos conforme necessário |
| Relatórios estatísticos precisam mesclar várias tabelas | Uma tabela principal para todas as estatísticas de chamados |
| Mudanças de processo exigem modificações em vários lugares | Mudanças no processo central em apenas um lugar |
| Novos tipos de negócio exigem novas tabelas | Basta adicionar tabelas de extensão, o fluxo principal permanece inalterado |

#### Filosofia Dois: Equipe de Funcionários de IA

Não são apenas "recursos de IA", mas "funcionários de IA". Cada IA tem uma função, personalidade e responsabilidades claras:

| Funcionário de IA | Cargo | Responsabilidades Principais | Cenário de Ativação |
|-------------------|-------|-----------------------------|---------------------|
| **Sam** | Supervisor do Service Desk | Roteamento de chamados, avaliação de prioridade, decisões de escalonamento | Automático na criação do chamado |
| **Grace** | Especialista em Sucesso do Cliente | Geração de respostas, ajuste de tom, tratamento de reclamações | Quando o agente clica em "Resposta de IA" |
| **Max** | Assistente de Conhecimento | Casos semelhantes, recomendações de conhecimento, síntese de soluções | Automático na página de detalhes do chamado |
| **Lexi** | Tradutora | Tradução multilíngue, tradução de comentários | Automático quando um idioma estrangeiro é detectado |

**Por que o modelo de "Funcionário de IA"?**

- **Responsabilidades Claras**: Sam cuida do roteamento, Grace das respostas, sem confusão.
- **Fácil de Entender**: Dizer "Deixe o Sam analisar isso" é mais amigável do que "Chamar a API de classificação".
- **Extensível**: Adicionar novas capacidades de IA = contratar novos funcionários.

#### Filosofia Três: Autociclo de Conhecimento

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-09.png)

Isso forma um ciclo fechado de **Acúmulo de Conhecimento - Aplicação de Conhecimento**.

---

## 2. Entidades Centrais e Modelo de Dados

### 2.1 Visão Geral do Relacionamento de Entidades

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-23.png)


### 2.2 Detalhes das Tabelas Principais

#### 2.2.1 Tabela Principal de Chamados (nb_tts_tickets)

Este é o núcleo do sistema, utilizando um design de "tabela larga" com todos os campos comumente usados na tabela principal.

**Informações Básicas**

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| id | BIGINT | Chave primária | 1001 |
| ticket_no | VARCHAR | Número do chamado | TKT-20251229-0001 |
| title | VARCHAR | Título | Conexão de rede lenta |
| description | TEXT | Descrição do problema | Desde hoje cedo, a rede do escritório... |
| biz_type | VARCHAR | Tipo de negócio | it_support |
| priority | VARCHAR | Prioridade | P1 |
| status | VARCHAR | Status | processing |

**Rastreamento de Origem**

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| source_system | VARCHAR | Sistema de origem | crm / email / iot |
| source_channel | VARCHAR | Canal de origem | web / phone / wechat |
| external_ref_id | VARCHAR | ID de referência externa | CRM-2024-0001 |

**Informações de Contato**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| customer_id | BIGINT | ID do Cliente |
| contact_name | VARCHAR | Nome do contato |
| contact_phone | VARCHAR | Telefone de contato |
| contact_email | VARCHAR | E-mail de contato |
| contact_company | VARCHAR | Nome da empresa |

**Informações do Responsável**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| assignee_id | BIGINT | ID do responsável |
| assignee_department_id | BIGINT | ID do departamento do responsável |
| transfer_count | INT | Contagem de transferências |

**Nós de Tempo**

| Campo | Tipo | Descrição | Momento da Ativação |
|-------|------|-----------|---------------------|
| submitted_at | TIMESTAMP | Hora de envio | Na criação do chamado |
| assigned_at | TIMESTAMP | Hora de atribuição | Quando o responsável é definido |
| first_response_at | TIMESTAMP | Hora da primeira resposta | Na primeira resposta ao cliente |
| resolved_at | TIMESTAMP | Hora de resolução | Quando o status muda para resolvido |
| closed_at | TIMESTAMP | Hora de fechamento | Quando o status muda para fechado |

**Relacionado a SLA**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| sla_config_id | BIGINT | ID da configuração de SLA |
| sla_response_due | TIMESTAMP | Prazo limite de resposta |
| sla_resolve_due | TIMESTAMP | Prazo limite de resolução |
| sla_paused_at | TIMESTAMP | Hora de início da pausa do SLA |
| sla_paused_duration | INT | Duração acumulada da pausa (minutos) |
| is_sla_response_breached | BOOLEAN | Resposta fora do prazo |
| is_sla_resolve_breached | BOOLEAN | Resolução fora do prazo |

**Resultados da Análise de IA**

| Campo | Tipo | Descrição | Preenchido por |
|-------|------|-----------|----------------|
| ai_category_code | VARCHAR | Categoria identificada por IA | Sam |
| ai_sentiment | VARCHAR | Análise de sentimento | Sam |
| ai_urgency | VARCHAR | Nível de urgência | Sam |
| ai_keywords | JSONB | Palavras-chave | Sam |
| ai_reasoning | TEXT | Processo de raciocínio | Sam |
| ai_suggested_reply | TEXT | Sugestão de resposta | Sam/Grace |
| ai_confidence_score | NUMERIC | Pontuação de confiança | Sam |
| ai_analysis | JSONB | Resultado completo da análise | Sam |

**Suporte Multilíngue**

| Campo | Tipo | Descrição | Preenchido por |
|-------|------|-----------|----------------|
| source_language_code | VARCHAR | Idioma original | Sam/Lexi |
| target_language_code | VARCHAR | Idioma de destino | Padrão do sistema PT-BR |
| is_translated | BOOLEAN | Se foi traduzido | Lexi |
| description_translated | TEXT | Descrição traduzida | Lexi |

#### 2.2.2 Tabelas de Extensão de Negócio

**Reparo de Equipamento (nb_tts_biz_repair)**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| ticket_id | BIGINT | ID do chamado associado |
| equipment_model | VARCHAR | Modelo do equipamento |
| serial_number | VARCHAR | Número de série |
| fault_code | VARCHAR | Código de falha |
| spare_parts | JSONB | Lista de peças de reposição |
| maintenance_type | VARCHAR | Tipo de manutenção |

**Suporte de TI (nb_tts_biz_it_support)**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| ticket_id | BIGINT | ID do chamado associado |
| asset_number | VARCHAR | Número do ativo |
| os_version | VARCHAR | Versão do SO |
| software_name | VARCHAR | Software envolvido |
| remote_address | VARCHAR | Endereço remoto |
| error_code | VARCHAR | Código de erro |

**Reclamação de Cliente (nb_tts_biz_complaint)**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| ticket_id | BIGINT | ID do chamado associado |
| related_order_no | VARCHAR | Número do pedido relacionado |
| complaint_level | VARCHAR | Nível da reclamação |
| compensation_amount | DECIMAL | Valor da compensação |
| compensation_type | VARCHAR | Método de compensação |
| root_cause | TEXT | Causa raiz |

#### 2.2.3 Tabela de Comentários (nb_tts_ticket_comments)

**Campos Principais**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | BIGINT | Chave primária |
| ticket_id | BIGINT | ID do chamado |
| parent_id | BIGINT | ID do comentário pai (suporta estrutura em árvore) |
| content | TEXT | Conteúdo do comentário |
| direction | VARCHAR | Direção: inbound (cliente) / outbound (agente) |
| is_internal | BOOLEAN | Se é uma nota interna |
| is_first_response | BOOLEAN | Se é a primeira resposta |

**Campos de Revisão de IA (para outbound)**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| source_language_code | VARCHAR | Idioma de origem |
| content_translated | TEXT | Conteúdo traduzido |
| is_translated | BOOLEAN | Se foi traduzido |
| is_ai_blocked | BOOLEAN | Se foi bloqueado pela IA |
| ai_block_reason | VARCHAR | Motivo do bloqueio |
| ai_block_detail | TEXT | Explicação detalhada |
| ai_quality_score | NUMERIC | Pontuação de qualidade |
| ai_suggestions | TEXT | Sugestões de melhoria |

#### 2.2.4 Tabela de Avaliações (nb_tts_ratings)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| ticket_id | BIGINT | ID do chamado (único) |
| overall_rating | INT | Satisfação geral (1-5) |
| response_rating | INT | Velocidade de resposta (1-5) |
| professionalism_rating | INT | Profissionalismo (1-5) |
| resolution_rating | INT | Resolução do problema (1-5) |
| nps_score | INT | Pontuação NPS (0-10) |
| tags | JSONB | Etiquetas rápidas |
| comment | TEXT | Feedback por escrito |

#### 2.2.5 Tabela de Artigos de Conhecimento (nb_tts_qa_articles)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| article_no | VARCHAR | Número do artigo KB-T0001 |
| title | VARCHAR | Título |
| content | TEXT | Conteúdo (Markdown) |
| summary | TEXT | Resumo |
| category_code | VARCHAR | Código da categoria |
| keywords | JSONB | Palavras-chave |
| source_type | VARCHAR | Origem: chamado/faq/manual |
| source_ticket_id | BIGINT | ID do chamado de origem |
| ai_generated | BOOLEAN | Se foi gerado por IA |
| ai_quality_score | NUMERIC | Pontuação de qualidade |
| status | VARCHAR | Status: rascunho/publicado/arquivado |
| view_count | INT | Contagem de visualizações |
| helpful_count | INT | Contagem de "útil" |

### 2.3 Lista de Tabelas de Dados

| Nº | Nome da Tabela | Descrição | Tipo de Registro |
|----|----------------|-----------|------------------|
| 1 | nb_tts_tickets | Tabela principal de chamados | Dados de negócio |
| 2 | nb_tts_biz_repair | Extensão de reparo de equipamento | Dados de negócio |
| 3 | nb_tts_biz_it_support | Extensão de suporte de TI | Dados de negócio |
| 4 | nb_tts_biz_complaint | Extensão de reclamação de cliente | Dados de negócio |
| 5 | nb_tts_customers | Tabela principal de clientes | Dados de negócio |
| 6 | nb_tts_customer_contacts | Contatos de clientes | Dados de negócio |
| 7 | nb_tts_ticket_comments | Comentários do chamado | Dados de negócio |
| 8 | nb_tts_ratings | Avaliações de satisfação | Dados de negócio |
| 9 | nb_tts_qa_articles | Artigos de conhecimento | Dados de conhecimento |
| 10 | nb_tts_qa_article_relations | Relações de artigos | Dados de conhecimento |
| 11 | nb_tts_faqs | Perguntas frequentes (FAQs) | Dados de conhecimento |
| 12 | nb_tts_tickets_categories | Categorias de chamados | Dados de configuração |
| 13 | nb_tts_sla_configs | Configuração de SLA | Dados de configuração |
| 14 | nb_tts_skill_configs | Configuração de habilidades | Dados de configuração |
| 15 | nb_tts_business_types | Tipos de negócio | Dados de configuração |

---

## 3. Ciclo de Vida do Chamado

### 3.1 Definições de Status

| Status | Nome | Descrição | Cronômetro de SLA | Cor |
|--------|------|-----------|-------------------|-----|
| new | Novo | Recém-criado, aguardando atribuição | Iniciar | 🔵 Azul |
| assigned | Atribuído | Responsável definido, aguardando início | Continuar | 🔷 Ciano |
| processing | Em processamento | Sendo processado | Continuar | 🟠 Laranja |
| pending | Pendente | Aguardando feedback do cliente | **Pausado** | ⚫ Cinza |
| transferred | Transferido | Transferido para outra pessoa | Continuar | 🟣 Roxo |
| resolved | Resolvido | Aguardando confirmação do cliente | Parar | 🟢 Verde |
| closed | Fechado | Chamado finalizado | Parar | ⚫ Cinza |
| cancelled | Cancelado | Chamado cancelado | Parar | ⚫ Cinza |

### 3.2 Diagrama de Fluxo de Status

**Fluxo Principal (Esquerda para Direita)**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-45.png)

**Fluxos de Ramificação**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-42.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-53.png)


**Máquina de Estados Completa**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-54-23.png)

### 3.3 Regras de Transição de Status Principais

| De | Para | Condição de Ativação | Ação do Sistema |
|----|-----|----------------------|-----------------|
| new | assigned | Atribuir responsável | Registrar assigned_at |
| assigned | processing | Responsável clica em "Aceitar" | Nenhuma |
| processing | pending | Clicar em "Pausar" | Registrar sla_paused_at |
| pending | processing | Resposta do cliente / Retomada manual | Calcular duração da pausa, limpar paused_at |
| processing | resolved | Clicar em "Resolver" | Registrar resolved_at |
| resolved | closed | Confirmação do cliente / Timeout de 3 dias | Registrar closed_at |
| * | cancelled | Cancelar chamado | Nenhuma |


---

## 4. Gestão de Nível de Serviço (SLA)

### 4.1 Configuração de Prioridade e SLA

| Prioridade | Nome | Tempo de Resposta | Tempo de Resolução | Limiar de Alerta | Cenário Típico |
|------------|------|-------------------|--------------------|------------------|----------------|
| P0 | Crítico | 15 min | 2 horas | 80% | Sistema fora do ar, linha de produção parada |
| P1 | Alto | 1 hora | 8 horas | 80% | Falha em recurso importante |
| P2 | Médio | 4 horas | 24 horas | 80% | Problemas gerais |
| P3 | Baixo | 8 horas | 72 horas | 80% | Consultas, sugestões |

### 4.2 Lógica de Cálculo de SLA

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-53-54.png)

#### Na Criação do Chamado

```
sla_response_due = submitted_at + tempo_resposta_minutos
sla_resolve_due = submitted_at + tempo_resolucao_minutos
```

#### Na Pausa (pending)

```
-- Registrar hora de início da pausa
sla_paused_at = AGORA()
```

#### Na Retomada (de pending para processing)

```
-- Calcular duração da pausa
duracao_pausa = AGORA() - sla_paused_at

-- Adicionar à duração total da pausa
sla_paused_duration = sla_paused_duration + duracao_pausa

-- Estender prazos
sla_response_due = sla_response_due + duracao_pausa
sla_resolve_due = sla_resolve_due + duracao_pausa

-- Limpar hora de pausa
sla_paused_at = NULL
```

#### Determinação de Violação de SLA

```
-- Violação de resposta
is_sla_response_breached = (first_response_at É NULO E AGORA() > sla_response_due)
                        OU (first_response_at > sla_response_due)

-- Violação de resolução
is_sla_resolve_breached = (resolved_at É NULO E AGORA() > sla_resolve_due)
                       OU (resolved_at > sla_resolve_due)
```

### 4.3 Mecanismo de Alerta de SLA

| Nível de Alerta | Condição | Notificar | Método |
|-----------------|----------|-----------|--------|
| Alerta Amarelo | Tempo restante < 20% | Responsável | Notificação no app |
| Alerta Vermelho | Já expirado | Responsável + Supervisor | No app + E-mail |
| Alerta de Escalonamento | Expirado há 1 hora | Gerente de Departamento | E-mail + SMS |

### 4.4 Métricas do Painel de SLA

| Métrica | Fórmula | Limiar de Saúde |
|---------|---------|-----------------|
| Taxa de Conformidade de Resposta | Chamados sem violação / Total de chamados | > 95% |
| Taxa de Conformidade de Resolução | Resolvidos sem violação / Total de resolvidos | > 90% |
| Tempo Médio de Resposta | SOMA(tempo de resposta) / Contagem de chamados | < 50% do SLA |
| Tempo Médio de Resolução | SOMA(tempo de resolução) / Contagem de chamados | < 80% do SLA |

---

## 5. Capacidades de IA e Sistema de Funcionários

### 5.1 Equipe de Funcionários de IA

O sistema configura 8 funcionários de IA em duas categorias:

**Novos Funcionários (Específicos do Sistema de Chamados)**

| ID | Nome | Cargo | Capacidades Principais |
|----|------|-------|------------------------|
| sam | Sam | Supervisor do Service Desk | Roteamento, avaliação de prioridade, decisões de escalonamento, identificação de risco de SLA |
| grace | Grace | Especialista em Sucesso do Cliente | Geração de respostas profissionais, ajuste de tom, tratamento de reclamações, recuperação de satisfação |
| max | Max | Assistente de Conhecimento | Busca de casos semelhantes, recomendações de conhecimento, síntese de soluções |

**Funcionários Reutilizados (Capacidades Gerais)**

| ID | Nome | Cargo | Capacidades Principais |
|----|------|-------|------------------------|
| dex | Dex | Organizador de Dados | E-mail para chamado, telefone para chamado, limpeza de dados em lote |
| ellis | Ellis | Especialista em E-mail | Análise de sentimento de e-mail, resumo de threads, rascunho de respostas |
| lexi | Lexi | Tradutora | Tradução de chamados, tradução de respostas, tradução de conversas em tempo real |
| cole | Cole | Especialista NocoBase | Orientação de uso do sistema, ajuda na configuração de fluxos de trabalho |
| vera | Vera | Analista de Pesquisa | Pesquisa de soluções técnicas, verificação de informações de produtos |

### 5.2 Lista de Tarefas de IA

Cada funcionário de IA é configurado com 4 tarefas específicas:

#### Tarefas do Sam

| ID da Tarefa | Nome | Método de Ativação | Descrição |
|--------------|------|--------------------|-----------|
| SAM-01 | Análise e Roteamento de Chamados | Fluxo de trabalho automático | Analisa automaticamente na criação de novos chamados |
| SAM-02 | Reavaliação de Prioridade | Interação no frontend | Ajusta a prioridade com base em novas informações |
| SAM-03 | Decisão de Escalonamento | Frontend/Fluxo de trabalho | Determina se o escalonamento é necessário |
| SAM-04 | Avaliação de Risco de SLA | Fluxo de trabalho automático | Identifica riscos de estouro de prazo |

#### Tarefas da Grace

| ID da Tarefa | Nome | Método de Ativação | Descrição |
|--------------|------|--------------------|-----------|
| GRACE-01 | Geração de Resposta Profissional | Interação no frontend | Gera resposta com base no contexto |
| GRACE-02 | Ajuste de Tom de Resposta | Interação no frontend | Otimiza o tom de respostas existentes |
| GRACE-03 | Desescalonamento de Reclamações | Frontend/Fluxo de trabalho | Resolve e acalma reclamações de clientes |
| GRACE-04 | Recuperação de Satisfação | Frontend/Fluxo de trabalho | Acompanhamento após uma experiência negativa |

#### Tarefas do Max

| ID da Tarefa | Nome | Método de Ativação | Descrição |
|--------------|------|--------------------|-----------|
| MAX-01 | Busca de Casos Semelhantes | Frontend/Fluxo de trabalho | Encontra chamados históricos semelhantes |
| MAX-02 | Recomendação de Artigo de Conhecimento | Frontend/Fluxo de trabalho | Recomenda artigos de conhecimento relevantes |
| MAX-03 | Síntese de Soluções | Interação no frontend | Sintetiza soluções de múltiplas fontes |
| MAX-04 | Guia de Solução de Problemas | Interação no frontend | Cria um processo sistemático de diagnóstico |

#### Tarefas da Lexi

| ID da Tarefa | Nome | Método de Ativação | Descrição |
|--------------|------|--------------------|-----------|
| LEXI-01 | Tradução de Chamados | Fluxo de trabalho automático | Traduz o conteúdo do chamado |
| LEXI-02 | Tradução de Respostas | Interação no frontend | Traduz as respostas dos agentes |
| LEXI-03 | Tradução em Lote | Fluxo de trabalho automático | Processamento de tradução em massa |
| LEXI-04 | Tradução de Conversa em Tempo Real | Interação no frontend | Tradução de diálogo em tempo real |

### 5.3 Funcionários de IA e Ciclo de Vida do Chamado

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-04.png)

### 5.4 Exemplos de Resposta de IA

#### SAM-01 Resposta de Análise de Chamado

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "falha de login", "timeout", "fechamento mensal"],
  "confidence": 0.92,
  "reasoning": "Este chamado descreve um problema de login no sistema ERP afetando o fechamento mensal do departamento financeiro, urgência alta",
  "suggested_reply": "Prezado Cliente, obrigado por relatar este problema...",
  "source_language_code": "zh",
  "is_translated": true,
  "description_translated": "Olá, nosso sistema ERP não consegue fazer login..."
}
```

#### GRACE-01 Resposta de Geração de Resposta

```
Prezado Sr. Zhang,

Obrigado por entrar em contato conosco sobre o problema de login no ERP. Compreendo perfeitamente que este problema está afetando o trabalho de fechamento mensal da sua empresa, e priorizamos este caso como alta prioridade.

Status atual:
- A equipe técnica está investigando problemas de conexão com o servidor
- Previsão de atualização em até 30 minutos

Enquanto isso, você pode tentar:
1. Acessar pelo endereço de backup: https://erp-backup.company.com
2. Para necessidades urgentes de relatórios, entre em contato conosco para assistência na exportação

Sinta-se à vontade para me contatar se tiver qualquer outra dúvida.

Atenciosamente,
Equipe de Suporte Técnico
```

### 5.5 Filtro de Inteligência Emocional da IA

A revisão de qualidade de resposta da Grace bloqueia os seguintes problemas:

| Tipo de Problema | Exemplo Original | Sugestão da IA |
|------------------|------------------|----------------|
| Tom negativo | "Não, isso não está na garantia" | "Esta falha não é coberta pela garantia gratuita no momento, mas podemos oferecer um plano de reparo pago" |
| Culpar o cliente | "Você mesmo quebrou" | "Após verificação, esta falha trata-se de um dano acidental" |
| Transferir responsabilidade | "Não é problema nosso" | "Deixe-me ajudá-lo a investigar melhor a causa" |
| Expressão fria | "Não sei" | "Deixe-me consultar as informações relevantes para você" |
| Informação sensível | "Sua senha é abc123" | [Bloqueado] Contém informações sensíveis, envio não permitido |

---

## 6. Sistema de Base de Conhecimento

### 6.1 Fontes de Conhecimento

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-20.png)


### 6.2 Fluxo de Chamado para Conhecimento

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-38.png)

**Dimensões de Avaliação**:
- **Generalidade**: Este é um problema comum?
- **Completude**: A solução está clara e completa?
- **Reprodutibilidade**: Os passos são reutilizáveis?

### 6.3 Mecanismo de Recomendação de Conhecimento

Quando um agente abre os detalhes do chamado, o Max recomenda automaticamente conhecimentos relacionados:

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Conhecimento Recomendado                  [Expandir/Recolher] │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 Guia de Diagnóstico de Falhas CNC      Match: 94% │ │
│ │ Inclui: Interpretação de códigos de alarme, passos de verif. │ │
│ │ [Visualizar] [Aplicar à Resposta] [Marcar como Útil]     │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 Manual de Manutenção Série XYZ-CNC3000 Match: 87% │ │
│ │ Inclui: Falhas comuns, plano de manutenção preventiva    │ │
│ │ [Visualizar] [Aplicar à Resposta] [Marcar como Útil]     │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Motor de Fluxo de Trabalho

### 7.1 Categorias de Fluxo de Trabalho

| Código | Categoria | Descrição | Método de Ativação |
|--------|-----------|-----------|--------------------|
| WF-T | Fluxo de Chamado | Gestão do ciclo de vida do chamado | Eventos de formulário |
| WF-S | Fluxo de SLA | Cálculo de SLA e alertas | Eventos de formulário/Agendado |
| WF-C | Fluxo de Comentário | Processamento e tradução de comentários | Eventos de formulário |
| WF-R | Fluxo de Avaliação | Convites de avaliação e estatísticas | Eventos de formulário/Agendado |
| WF-N | Fluxo de Notificação | Envio de notificações | Baseado em eventos |
| WF-AI | Fluxo de IA | Análise e geração por IA | Eventos de formulário |

### 7.2 Fluxos de Trabalho Principais

#### WF-T01: Fluxo de Criação de Chamado

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-51.png)

#### WF-AI01: Análise de Chamado por IA

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-03.png)

#### WF-AI04: Tradução e Revisão de Comentários

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-19.png)

#### WF-AI03: Geração de Conhecimento

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-37.png)

### 7.3 Tarefas Agendadas

| Tarefa | Frequência | Descrição |
|--------|------------|-----------|
| Verificação de Alerta de SLA | A cada 5 minutos | Verifica chamados prestes a expirar |
| Fechamento Automático | Diário | Fecha chamados resolvidos após 3 dias |
| Convite de Avaliação | Diário | Envia convite de avaliação 24h após o fechamento |
| Atualização de Estatísticas | Horário | Atualiza estatísticas de chamados do cliente |

---

## 8. Design de Menu e Interface

### 8.1 Painel Administrativo (Backend)

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-10.png)

### 8.2 Portal do Cliente

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-32.png)

### 8.3 Design do Painel de Indicadores (Dashboard)

#### Visão Executiva

| Componente | Tipo | Descrição dos Dados |
|------------|------|---------------------|
| Taxa de Conformidade SLA | Medidor | Conformidade de resposta/resolução deste mês |
| Tendência de Satisfação | Gráfico de Linha | Mudanças na satisfação nos últimos 30 dias |
| Tendência de Volume | Gráfico de Barras | Volume de chamados nos últimos 30 dias |
| Distribuição por Tipo | Gráfico de Pizza | Proporção de cada tipo de negócio |

#### Visão do Supervisor

| Componente | Tipo | Descrição dos Dados |
|------------|------|---------------------|
| Alertas de Timeout | Lista | Chamados prestes a expirar ou já expirados |
| Carga de Trabalho da Equipe | Gráfico de Barras | Contagem de chamados por membro da equipe |
| Distribuição de Pendências | Gráfico Empilhado | Contagem de chamados por status |
| Tempo de Processamento | Mapa de Calor | Distribuição do tempo médio de processamento |

#### Visão do Agente

| Componente | Tipo | Descrição dos Dados |
|------------|------|---------------------|
| Minhas Tarefas | Card Numérico | Contagem de chamados pendentes |
| Distribuição de Prioridade | Gráfico de Pizza | Distribuição P0/P1/P2/P3 |
| Estatísticas de Hoje | Card de Métrica | Contagem de processados/resolvidos hoje |
| Contagem Regressiva SLA | Lista | Top 5 chamados mais urgentes |

---

## Apêndice

### A. Configuração de Tipos de Negócio

| Código do Tipo | Nome | Ícone | Tabela de Extensão Associada |
|----------------|------|-------|-----------------------------|
| repair | Reparo de Equipamento | 🔧 | nb_tts_biz_repair |
| it_support | Suporte de TI | 💻 | nb_tts_biz_it_support |
| complaint | Reclamação de Cliente | 📢 | nb_tts_biz_complaint |
| consultation | Consulta | ❓ | Nenhuma |
| other | Outro | 📝 | Nenhuma |

### B. Códigos de Categoria

| Código | Nome | Descrição |
|--------|------|-----------|
| CONVEYOR | Sistema de Correia | Problemas no sistema de correia transportadora |
| PACKAGING | Máquina de Embalagem | Problemas na máquina de embalagem |
| WELDING | Equipamento de Solda | Problemas no equipamento de solda |
| COMPRESSOR | Compressor de Ar | Problemas no compressor de ar |
| COLD_STORE | Armazenamento Frio | Problemas no armazenamento frio |
| CENTRAL_AC | Ar Condicionado Central | Problemas no AC central |
| FORKLIFT | Empilhadeira | Problemas na empilhadeira |
| COMPUTER | Computador | Problemas de hardware de computador |
| PRINTER | Impressora | Problemas de impressora |
| PROJECTOR | Projetor | Problemas de projetor |
| INTERNET | Rede | Problemas de conectividade de rede |
| EMAIL | E-mail | Problemas no sistema de e-mail |
| ACCESS | Acesso | Problemas de permissão de conta |
| PROD_INQ | Consulta de Produto | Consulta sobre produto |
| COMPLAINT | Reclamação Geral | Reclamação geral |
| DELAY | Atraso no Envio | Reclamação de atraso no envio |
| DAMAGE | Dano na Embalagem | Reclamação de dano na embalagem |
| QUANTITY | Falta de Quantidade | Reclamação de falta de itens |
| SVC_ATTITUDE | Atitude de Serviço | Reclamação de atitude no atendimento |
| PROD_QUALITY | Qualidade do Produto | Reclamação de qualidade do produto |
| TRAINING | Treinamento | Solicitação de treinamento |
| RETURN | Devolução | Solicitação de devolução |

---

*Versão do Documento: 2.0 | Última Atualização: 05-01-2026*