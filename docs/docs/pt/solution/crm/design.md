:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/solution/crm/design).
:::

# Design Detalhado do Sistema CRM 2.0

## 1. Visão Geral do Sistema e Filosofia de Design

### 1.1 Posicionamento do Sistema

Este sistema é uma **Plataforma de Gestão de Vendas CRM 2.0** construída sobre a plataforma no-code NocoBase. O objetivo central é:

```
Permitir que as vendas se concentrem em construir relacionamentos com os clientes, e não na entrada de dados e análises repetitivas.
```

O sistema automatiza tarefas rotineiras por meio de fluxos de trabalho e utiliza IA para auxiliar na pontuação de leads, análise de oportunidades e outras tarefas, ajudando as equipes de vendas a aumentar a eficiência.

### 1.2 Filosofia de Design

#### Princípio 1: Funil de Vendas Completo

**Processo de Vendas de Ponta a Ponta:**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**Por que projetar desta forma?**

| Método Tradicional | CRM Integrado |
|---------|-----------|
| Múltiplos sistemas usados para diferentes estágios | Sistema único cobrindo todo o ciclo de vida |
| Transferência manual de dados entre sistemas | Fluxo de dados e conversão automatizados |
| Visões de cliente inconsistentes | Visão unificada de 360 graus do cliente |
| Análise de dados fragmentada | Análise de pipeline de vendas de ponta a ponta |

#### Princípio 2: Pipeline de Vendas Configurável
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)

Diferentes setores podem personalizar os estágios do pipeline de vendas sem modificar o código.

#### Princípio 3: Design Modular

- Módulos principais (Clientes + Oportunidades) são obrigatórios; outros módulos podem ser ativados conforme a necessidade.
- A desativação de módulos não requer alterações de código; é feita através da interface de configuração do NocoBase.
- Cada módulo é projetado de forma independente para reduzir o acoplamento.

---

## 2. Arquitetura de Módulos e Customização

### 2.1 Visão Geral dos Módulos

O sistema CRM adota um design de **arquitetura modular** — cada módulo pode ser ativado ou desativado independentemente com base nos requisitos do negócio.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 Dependências de Módulos

| Módulo | Obrigatório | Dependências | Condição de Desativação |
|-----|---------|--------|---------|
| **Gestão de Clientes** | ✅ Sim | - | Não pode ser desativado (Core) |
| **Gestão de Oportunidades** | ✅ Sim | Gestão de Clientes | Não pode ser desativado (Core) |
| **Gestão de Leads** | Opcional | - | Quando a aquisição de leads não for necessária |
| **Gestão de Cotações** | Opcional | Oportunidades, Produtos | Transações simples que não exigem cotações formais |
| **Gestão de Pedidos** | Opcional | Oportunidades (ou Cotações) | Quando o rastreamento de pedidos/pagamentos não for necessário |
| **Gestão de Produtos** | Opcional | - | Quando um catálogo de produtos não for necessário |
| **Integração de E-mail** | Opcional | Clientes, Contatos | Ao usar um sistema de e-mail externo |

### 2.3 Versões Pré-configuradas

| Versão | Módulos Incluídos | Caso de Uso | Número de Coleções |
|-----|---------|---------|-----------|
| **Lite (Leve)** | Clientes + Oportunidades | Rastreamento de transações simples | 6 |
| **Standard (Padrão)** | Lite + Leads + Cotações + Pedidos + Produtos | Ciclo de vendas completo | 15 |
| **Enterprise (Corporativa)** | Standard + Integração de E-mail | Funcionalidade completa incluindo e-mail | 17 |

### 2.4 Mapeamento de Módulo para Coleção

#### Coleções de Módulos Core (Sempre Necessárias)

| Coleção | Módulo | Descrição |
|-------|------|------|
| nb_crm_customers | Gestão de Clientes | Registros de Clientes/Empresas |
| nb_crm_contacts | Gestão de Clientes | Contatos |
| nb_crm_customer_shares | Gestão de Clientes | Permissões de compartilhamento de clientes |
| nb_crm_opportunities | Gestão de Oportunidades | Oportunidades de vendas |
| nb_crm_opportunity_stages | Gestão de Oportunidades | Configurações de estágios |
| nb_crm_opportunity_users | Gestão de Oportunidades | Colaboradores da oportunidade |
| nb_crm_activities | Gestão de Atividades | Registros de atividades |
| nb_crm_comments | Gestão de Atividades | Comentários/Notas |
| nb_crm_tags | Core | Tags compartilhadas |
| nb_cbo_currencies | Dados Base | Dicionário de moedas |
| nb_cbo_regions | Dados Base | Dicionário de Países/Regiões |

### 2.5 Como Desativar Módulos

Basta ocultar a entrada do menu para o módulo na interface de administração do NocoBase; não há necessidade de modificar o código ou excluir coleções.

---

## 3. Entidades Principais e Modelo de Dados

### 3.1 Visão Geral do Relacionamento de Entidades
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 Detalhes das Coleções Principais

#### 3.2.1 Leads (nb_crm_leads)

Gestão de leads usando um fluxo de trabalho simplificado de 4 estágios.

**Processo de Estágio:**
```
Novo → Em andamento → Qualificado → Convertido em Cliente/Oportunidade
         ↓              ↓
   Desqualificado  Desqualificado
```

**Campos Principais:**

| Campo | Tipo | Descrição |
|-----|------|------|
| id | BIGINT | Chave Primária |
| lead_no | VARCHAR | Número do Lead (Gerado automaticamente) |
| name | VARCHAR | Nome do Contato |
| company | VARCHAR | Nome da Empresa |
| title | VARCHAR | Cargo |
| email | VARCHAR | E-mail |
| phone | VARCHAR | Telefone |
| mobile_phone | VARCHAR | Celular |
| website | TEXT | Site |
| address | TEXT | Endereço |
| source | VARCHAR | Fonte do Lead: website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | Setor |
| annual_revenue | VARCHAR | Escala de Receita Anual |
| number_of_employees | VARCHAR | Escala de Número de Funcionários |
| status | VARCHAR | Status: new/working/qualified/unqualified |
| rating | VARCHAR | Classificação: hot/warm/cold |
| owner_id | BIGINT | Responsável (FK → users) |
| ai_score | INTEGER | Pontuação de Qualidade IA 0-100 |
| ai_convert_prob | DECIMAL | Probabilidade de Conversão IA |
| ai_best_contact_time | VARCHAR | Horário de Contato Recomendado pela IA |
| ai_tags | JSONB | Tags Geradas por IA |
| ai_scored_at | TIMESTAMP | Hora da Pontuação IA |
| ai_next_best_action | TEXT | Sugestão de Próxima Melhor Ação da IA |
| ai_nba_generated_at | TIMESTAMP | Hora de Geração da Sugestão IA |
| is_converted | BOOLEAN | Flag de Convertido |
| converted_at | TIMESTAMP | Hora da Conversão |
| converted_customer_id | BIGINT | ID do Cliente Convertido |
| converted_contact_id | BIGINT | ID do Contato Convertido |
| converted_opportunity_id | BIGINT | ID da Oportunidade Convertida |
| lost_reason | TEXT | Motivo da Perda |
| disqualification_reason | TEXT | Motivo da Desqualificação |
| description | TEXT | Descrição |

#### 3.2.2 Clientes (nb_crm_customers)

Gestão de Clientes/Empresas com suporte a negócios internacionais.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-----|------|------|
| id | BIGINT | Chave Primária |
| name | VARCHAR | Nome do Cliente (Obrigatório) |
| account_number | VARCHAR | Número da Conta (Gerado automaticamente, Único) |
| phone | VARCHAR | Telefone |
| website | TEXT | Site |
| address | TEXT | Endereço |
| industry | VARCHAR | Setor |
| type | VARCHAR | Tipo: prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | Escala de Número de Funcionários |
| annual_revenue | VARCHAR | Escala de Receita Anual |
| level | VARCHAR | Nível: normal/important/vip |
| status | VARCHAR | Status: potential/active/dormant/churned |
| country | VARCHAR | País |
| region_id | BIGINT | Região (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Moeda Preferencial: CNY/USD/EUR |
| owner_id | BIGINT | Responsável (FK → users) |
| parent_id | BIGINT | Empresa Mãe (FK → self) |
| source_lead_id | BIGINT | ID do Lead de Origem |
| ai_health_score | INTEGER | Pontuação de Saúde IA 0-100 |
| ai_health_grade | VARCHAR | Grau de Saúde IA: A/B/C/D |
| ai_churn_risk | DECIMAL | Risco de Churn IA 0-100% |
| ai_churn_risk_level | VARCHAR | Nível de Risco de Churn IA: low/medium/high |
| ai_health_dimensions | JSONB | Pontuações de Dimensões de Saúde IA |
| ai_recommendations | JSONB | Lista de Recomendações IA |
| ai_health_assessed_at | TIMESTAMP | Hora da Avaliação de Saúde IA |
| ai_tags | JSONB | Tags Geradas por IA |
| ai_best_contact_time | VARCHAR | Horário de Contato Recomendado pela IA |
| ai_next_best_action | TEXT | Sugestão de Próxima Melhor Ação da IA |
| ai_nba_generated_at | TIMESTAMP | Hora de Geração da Sugestão IA |
| description | TEXT | Descrição |
| is_deleted | BOOLEAN | Flag de Exclusão Lógica |

#### 3.2.3 Oportunidades (nb_crm_opportunities)

Gestão de oportunidades de vendas com estágios de pipeline configuráveis.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-----|------|------|
| id | BIGINT | Chave Primária |
| opportunity_no | VARCHAR | Número da Oportunidade (Gerado automaticamente, Único) |
| name | VARCHAR | Nome da Oportunidade (Obrigatório) |
| amount | DECIMAL | Valor Esperado |
| currency | VARCHAR | Moeda |
| exchange_rate | DECIMAL | Taxa de Câmbio |
| amount_usd | DECIMAL | Valor Equivalente em USD |
| customer_id | BIGINT | Cliente (FK) |
| contact_id | BIGINT | Contato Principal (FK) |
| stage | VARCHAR | Código do Estágio (FK → stages.code) |
| stage_sort | INTEGER | Ordem de Classificação do Estágio (Redundante para facilitar ordenação) |
| stage_entered_at | TIMESTAMP | Hora de Entrada no Estágio Atual |
| days_in_stage | INTEGER | Dias no Estágio Atual |
| win_probability | DECIMAL | Probabilidade de Ganho Manual |
| ai_win_probability | DECIMAL | Probabilidade de Ganho Prevista por IA |
| ai_analyzed_at | TIMESTAMP | Hora da Análise IA |
| ai_confidence | DECIMAL | Confiança da Previsão IA |
| ai_trend | VARCHAR | Tendência da Previsão IA: up/stable/down |
| ai_risk_factors | JSONB | Fatores de Risco Identificados pela IA |
| ai_recommendations | JSONB | Lista de Recomendações IA |
| ai_predicted_close | DATE | Data de Fechamento Prevista pela IA |
| ai_next_best_action | TEXT | Sugestão de Próxima Melhor Ação da IA |
| ai_nba_generated_at | TIMESTAMP | Hora de Geração da Sugestão IA |
| expected_close_date | DATE | Data de Fechamento Esperada |
| actual_close_date | DATE | Data de Fechamento Real |
| owner_id | BIGINT | Responsável (FK → users) |
| last_activity_at | TIMESTAMP | Hora da Última Atividade |
| stagnant_days | INTEGER | Dias Sem Atividade |
| loss_reason | TEXT | Motivo da Perda |
| competitor_id | BIGINT | Concorrente (FK) |
| lead_source | VARCHAR | Fonte do Lead |
| campaign_id | BIGINT | ID da Campanha de Marketing |
| expected_revenue | DECIMAL | Receita Esperada = valor × probabilidade |
| description | TEXT | Descrição |

#### 3.2.4 Cotações (nb_crm_quotations)

Gestão de cotações com suporte a multimoeda e fluxos de trabalho de aprovação.

**Fluxo de Status:**
```
Rascunho → Aprovação Pendente → Aprovado → Enviado → Aceito/Rejeitado/Expirado
                 ↓
             Rejeitado → Editar → Rascunho
```

**Campos Principais:**

| Campo | Tipo | Descrição |
|-----|------|------|
| id | BIGINT | Chave Primária |
| quotation_no | VARCHAR | Nº da Cotação (Gerado automaticamente, Único) |
| name | VARCHAR | Nome da Cotação |
| version | INTEGER | Número da Versão |
| opportunity_id | BIGINT | Oportunidade (FK, Obrigatório) |
| customer_id | BIGINT | Cliente (FK) |
| contact_id | BIGINT | Contato (FK) |
| owner_id | BIGINT | Responsável (FK → users) |
| currency_id | BIGINT | Moeda (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | Taxa de Câmbio |
| subtotal | DECIMAL | Subtotal |
| discount_rate | DECIMAL | Taxa de Desconto |
| discount_amount | DECIMAL | Valor do Desconto |
| shipping_handling | DECIMAL | Frete/Manuseio |
| tax_rate | DECIMAL | Taxa de Imposto |
| tax_amount | DECIMAL | Valor do Imposto |
| total_amount | DECIMAL | Valor Total |
| total_amount_usd | DECIMAL | Valor Equivalente em USD |
| status | VARCHAR | Status: draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | Hora de Submissão |
| approved_by | BIGINT | Aprovador (FK → users) |
| approved_at | TIMESTAMP | Hora da Aprovação |
| rejected_at | TIMESTAMP | Hora da Rejeição |
| sent_at | TIMESTAMP | Hora do Envio |
| customer_response_at | TIMESTAMP | Hora da Resposta do Cliente |
| expired_at | TIMESTAMP | Hora da Expiração |
| valid_until | DATE | Válido Até |
| payment_terms | TEXT | Condições de Pagamento |
| terms_condition | TEXT | Termos e Condições |
| address | TEXT | Endereço de Entrega |
| description | TEXT | Descrição |

#### 3.2.5 Pedidos (nb_crm_orders)

Gestão de pedidos incluindo rastreamento de pagamentos.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-----|------|------|
| id | BIGINT | Chave Primária |
| order_no | VARCHAR | Número do Pedido (Gerado automaticamente, Único) |
| customer_id | BIGINT | Cliente (FK) |
| contact_id | BIGINT | Contato (FK) |
| opportunity_id | BIGINT | Oportunidade (FK) |
| quotation_id | BIGINT | Cotação (FK) |
| owner_id | BIGINT | Responsável (FK → users) |
| currency | VARCHAR | Moeda |
| exchange_rate | DECIMAL | Taxa de Câmbio |
| order_amount | DECIMAL | Valor do Pedido |
| paid_amount | DECIMAL | Valor Pago |
| unpaid_amount | DECIMAL | Valor Não Pago |
| status | VARCHAR | Status: pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | Status do Pagamento: unpaid/partial/paid |
| order_date | DATE | Data do Pedido |
| delivery_date | DATE | Data de Entrega Esperada |
| actual_delivery_date | DATE | Data de Entrega Real |
| shipping_address | TEXT | Endereço de Entrega |
| logistics_company | VARCHAR | Empresa de Logística |
| tracking_no | VARCHAR | Número de Rastreamento |
| terms_condition | TEXT | Termos e Condições |
| description | TEXT | Descrição |

### 3.3 Resumo das Coleções

#### Coleções de Negócio do CRM

| Nº | Nome da Coleção | Descrição | Tipo |
|-----|------|------|------|
| 1 | nb_crm_leads | Gestão de Leads | Negócio |
| 2 | nb_crm_customers | Clientes/Empresas | Negócio |
| 3 | nb_crm_contacts | Contatos | Negócio |
| 4 | nb_crm_opportunities | Oportunidades de Vendas | Negócio |
| 5 | nb_crm_opportunity_stages | Configuração de Estágios | Configuração |
| 6 | nb_crm_opportunity_users | Colaboradores da Oportunidade (Equipe de Vendas) | Associação |
| 7 | nb_crm_quotations | Cotações | Negócio |
| 8 | nb_crm_quotation_items | Itens da Cotação | Negócio |
| 9 | nb_crm_quotation_approvals | Registros de Aprovação | Negócio |
| 10 | nb_crm_orders | Pedidos | Negócio |
| 11 | nb_crm_order_items | Itens do Pedido | Negócio |
| 12 | nb_crm_payments | Registros de Pagamento | Negócio |
| 13 | nb_crm_products | Catálogo de Produtos | Negócio |
| 14 | nb_crm_product_categories | Categorias de Produtos | Configuração |
| 15 | nb_crm_price_tiers | Preços por Faixa | Configuração |
| 16 | nb_crm_activities | Registros de Atividade | Negócio |
| 17 | nb_crm_comments | Comentários/Notas | Negócio |
| 18 | nb_crm_competitors | Concorrentes | Negócio |
| 19 | nb_crm_tags | Tags | Configuração |
| 20 | nb_crm_lead_tags | Associação Lead-Tag | Associação |
| 21 | nb_crm_contact_tags | Associação Contato-Tag | Associação |
| 22 | nb_crm_customer_shares | Permissões de Compartilhamento de Clientes | Associação |
| 23 | nb_crm_exchange_rates | Histórico de Taxas de Câmbio | Configuração |

#### Coleções de Dados Base (Módulos Comuns)

| Nº | Nome da Coleção | Descrição | Tipo |
|-----|------|------|------|
| 1 | nb_cbo_currencies | Dicionário de Moedas | Configuração |
| 2 | nb_cbo_regions | Dicionário de Países/Regiões | Configuração |

### 3.4 Coleções Auxiliares

#### 3.4.1 Comentários (nb_crm_comments)

Coleção genérica de comentários/notas que pode ser associada a vários objetos de negócio.

| Campo | Tipo | Descrição |
|-----|------|------|
| id | BIGINT | Chave Primária |
| content | TEXT | Conteúdo do Comentário |
| lead_id | BIGINT | Lead Associado (FK) |
| customer_id | BIGINT | Cliente Associado (FK) |
| opportunity_id | BIGINT | Oportunidade Associada (FK) |
| order_id | BIGINT | Pedido Associado (FK) |

#### 3.4.2 Compartilhamento de Clientes (nb_crm_customer_shares)

Permite colaboração entre várias pessoas e compartilhamento de permissões para clientes.

| Campo | Tipo | Descrição |
|-----|------|------|
| id | BIGINT | Chave Primária |
| customer_id | BIGINT | Cliente (FK, Obrigatório) |
| shared_with_user_id | BIGINT | Compartilhado com Usuário (FK, Obrigatório) |
| shared_by_user_id | BIGINT | Compartilhado por Usuário (FK) |
| permission_level | VARCHAR | Nível de Permissão: read/write/full |
| shared_at | TIMESTAMP | Hora do Compartilhamento |

#### 3.4.3 Colaboradores da Oportunidade (nb_crm_opportunity_users)

Suporta a colaboração da equipe de vendas em oportunidades.

| Campo | Tipo | Descrição |
|-----|------|------|
| opportunity_id | BIGINT | Oportunidade (FK, PK Composta) |
| user_id | BIGINT | Usuário (FK, PK Composta) |
| role | VARCHAR | Papel: owner/collaborator/viewer |

#### 3.4.4 Regiões (nb_cbo_regions)

Dicionário de dados base de Países/Regiões.

| Campo | Tipo | Descrição |
|-----|------|------|
| id | BIGINT | Chave Primária |
| code_alpha2 | VARCHAR | Código ISO 3166-1 Alpha-2 (Único) |
| code_alpha3 | VARCHAR | Código ISO 3166-1 Alpha-3 (Único) |
| code_numeric | VARCHAR | Código Numérico ISO 3166-1 |
| name | VARCHAR | Nome do País/Região |
| is_active | BOOLEAN | Está Ativo |
| sort_order | INTEGER | Ordem de Classificação |

---

## 4. Ciclo de Vida do Lead

A gestão de leads utiliza um fluxo de trabalho simplificado de 4 estágios. Quando um novo lead é criado, um fluxo de trabalho pode acionar automaticamente a pontuação por IA para ajudar as vendas a identificar rapidamente leads de alta qualidade.

### 4.1 Definições de Status

| Status | Nome | Descrição |
|-----|------|------|
| new | Novo | Recém-criado, aguardando contato |
| working | Em acompanhamento | Seguindo ativamente |
| qualified | Qualificado | Pronto para conversão |
| unqualified | Desqualificado | Não se encaixa no perfil |

### 4.2 Fluxograma de Status

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 Processo de Conversão de Leads

A interface de conversão oferece três opções simultaneamente; você pode optar por criar ou associar:

- **Cliente**: Criar um novo cliente OU associar a um cliente existente.
- **Contato**: Criar um novo contato (associado ao cliente).
- **Oportunidade**: Uma oportunidade deve ser criada.
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**Registros Pós-conversão:**
- `converted_customer_id`: ID do Cliente Associado
- `converted_contact_id`: ID do Contato Associado
- `converted_opportunity_id`: ID da Oportunidade Criada

---

## 5. Ciclo de Vida da Oportunidade

A gestão de oportunidades utiliza estágios de pipeline de vendas configuráveis. Quando o estágio de uma oportunidade muda, ele pode acionar automaticamente a previsão de probabilidade de ganho por IA para ajudar as vendas a identificar riscos e oportunidades.

### 5.1 Estágios Configuráveis

Os estágios são armazenados na coleção `nb_crm_opportunity_stages` e podem ser personalizados:

| Código | Nome | Ordem | Probabilidade de Ganho Padrão |
|-----|------|------|---------|
| prospecting | Prospecção | 1 | 10% |
| analysis | Análise de Necessidades | 2 | 30% |
| proposal | Proposta/Cotação de Preço | 3 | 60% |
| negotiation | Negociação/Revisão | 4 | 80% |
| won | Fechado Ganho | 5 | 100% |
| lost | Fechado Perdido | 6 | 0% |

### 5.2 Fluxo do Pipeline
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)

### 5.3 Detecção de Estagnação

Oportunidades sem atividade serão sinalizadas:

| Dias Sem Atividade | Ação |
|-----------|------|
| 7 Dias | Aviso Amarelo |
| 14 Dias | Lembrete Laranja ao Responsável |
| 30 Dias | Lembrete Vermelho ao Gerente |

```sql
-- Calcular dias de estagnação
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 Tratamento de Ganho/Perda

**Quando Ganho:**
1. Atualizar estágio para 'won'.
2. Registrar data de fechamento real.
3. Atualizar status do cliente para 'active'.
4. Acionar criação de pedido (se uma cotação foi aceita).

**Quando Perdido:**
1. Atualizar estágio para 'lost'.
2. Registrar motivo da perda.
3. Registrar ID do concorrente (se perdido para um concorrente).
4. Notificar o gerente.

---

## 6. Ciclo de Vida da Cotação

### 6.1 Definições de Status

| Status | Nome | Descrição |
|-----|------|------|
| draft | Rascunho | Em preparação |
| pending_approval | Aprovação Pendente | Aguardando aprovação |
| approved | Aprovado | Pronto para enviar |
| sent | Enviado | Enviado ao cliente |
| accepted | Aceito | Aceito pelo cliente |
| rejected | Rejeitado | Rejeitado pelo cliente |
| expired | Expirado | Passou da data de validade |

### 6.2 Regras de Aprovação (A serem finalizadas)

Os fluxos de trabalho de aprovação são acionados com base nas seguintes condições:

| Condição | Nível de Aprovação |
|------|---------|
| Desconto > 10% | Gerente de Vendas |
| Desconto > 20% | Diretor de Vendas |
| Valor > $100K | Financeiro + Gerente Geral |

### 6.3 Suporte Multimoeda

#### Filosofia de Design

Use **USD como a moeda base unificada** para todos os relatórios e análises. Cada registro de valor armazena:
- Moeda e valor originais (o que o cliente vê)
- Taxa de câmbio no momento da transação
- Valor equivalente em USD (para comparação interna)

#### Dicionário de Moedas (nb_cbo_currencies)

A configuração de moedas usa uma coleção de dados base comum, suportando gestão dinâmica. O campo `current_rate` armazena a taxa de câmbio atual, atualizada por uma tarefa agendada a partir do registro mais recente em `nb_crm_exchange_rates`.

| Campo | Tipo | Descrição |
|-----|------|------|
| id | BIGINT | Chave Primária |
| code | VARCHAR | Código da Moeda (Único): USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | Nome da Moeda |
| symbol | VARCHAR | Símbolo da Moeda |
| decimal_places | INTEGER | Casas Decimais |
| current_rate | DECIMAL | Taxa Atual para USD (Sincronizada do histórico) |
| is_active | BOOLEAN | Está Ativo |
| sort_order | INTEGER | Ordem de Classificação |

#### Histórico de Taxas de Câmbio (nb_crm_exchange_rates)

Registra dados históricos de taxas de câmbio. Uma tarefa agendada sincroniza as taxas mais recentes para `nb_cbo_currencies.current_rate`.

| Campo | Tipo | Descrição |
|-----|------|------|
| id | BIGINT | Chave Primária |
| currency_code | VARCHAR | Código da Moeda (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | Taxa para USD |
| effective_date | DATE | Data de Vigência |
| source | VARCHAR | Fonte: manual/api |
| createdAt | TIMESTAMP | Hora de Criação |

> **Nota**: As cotações são associadas à coleção `nb_cbo_currencies` via chave estrangeira `currency_id`, e a taxa de câmbio é recuperada diretamente do campo `current_rate`. Oportunidades e pedidos usam um campo VARCHAR `currency` para armazenar o código da moeda.

#### Padrão de Campos de Valor

Coleções contendo valores seguem este padrão:

| Campo | Tipo | Descrição |
|-----|------|------|
| currency | VARCHAR | Moeda da Transação |
| amount | DECIMAL | Valor Original |
| exchange_rate | DECIMAL | Taxa de Câmbio para USD na transação |
| amount_usd | DECIMAL | Equivalente em USD (Calculado) |

**Aplicado a:**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### Integração de Fluxo de Trabalho
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)

**Lógica de Recuperação de Taxa de Câmbio:**
1. Recuperar a taxa de câmbio diretamente de `nb_cbo_currencies.current_rate` durante as operações de negócio.
2. Transações em USD: Taxa = 1.0, nenhuma busca necessária.
3. `current_rate` é sincronizado por uma tarefa agendada a partir do último registro de `nb_crm_exchange_rates`.

### 6.4 Gestão de Versão

Quando uma cotação é rejeitada ou expira, ela pode ser duplicada como uma nova versão:

```
QT-20260119-001 v1 → Rejeitado
QT-20260119-001 v2 → Enviado
QT-20260119-001 v3 → Aceito
```

---

## 7. Ciclo de Vida do Pedido

### 7.1 Visão Geral do Pedido

Os pedidos são criados quando uma cotação é aceita, representando um compromisso de negócio confirmado.
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)

### 7.2 Definições de Status do Pedido

| Status | Código | Descrição | Ações Permitidas |
|-----|------|------|---------|
| Rascunho | `draft` | Pedido criado, ainda não confirmado | Editar, Confirmar, Cancelar |
| Confirmado | `confirmed` | Pedido confirmado, aguardando cumprimento | Iniciar Cumprimento, Cancelar |
| Em Processamento | `in_progress` | Pedido sendo processado/produzido | Atualizar Progresso, Enviar, Cancelar (requer aprovação) |
| Enviado | `shipped` | Produtos enviados ao cliente | Marcar como Entregue |
| Entregue | `delivered` | Cliente recebeu as mercadorias | Concluir Pedido |
| Concluído | `completed` | Pedido totalmente finalizado | Nenhuma |
| Cancelado | `cancelled` | Pedido cancelado | Nenhuma |

### 7.3 Modelo de Dados do Pedido

#### nb_crm_orders

| Campo | Tipo | Descrição |
|-----|------|------|
| id | BIGINT | Chave Primária |
| order_no | VARCHAR | Número do Pedido (Gerado automaticamente, Único) |
| customer_id | BIGINT | Cliente (FK) |
| contact_id | BIGINT | Contato (FK) |
| opportunity_id | BIGINT | Oportunidade (FK) |
| quotation_id | BIGINT | Cotação (FK) |
| owner_id | BIGINT | Responsável (FK → users) |
| status | VARCHAR | Status do Pedido |
| payment_status | VARCHAR | Status do Pagamento: unpaid/partial/paid |
| order_date | DATE | Data do Pedido |
| delivery_date | DATE | Data de Entrega Esperada |
| actual_delivery_date | DATE | Data de Entrega Real |
| currency | VARCHAR | Moeda do Pedido |
| exchange_rate | DECIMAL | Taxa para USD |
| order_amount | DECIMAL | Valor Total do Pedido |
| paid_amount | DECIMAL | Valor Pago |
| unpaid_amount | DECIMAL | Valor Não Pago |
| shipping_address | TEXT | Endereço de Entrega |
| logistics_company | VARCHAR | Empresa de Logística |
| tracking_no | VARCHAR | Número de Rastreamento |
| terms_condition | TEXT | Termos e Condições |
| description | TEXT | Descrição |

#### nb_crm_order_items

| Campo | Tipo | Descrição |
|-----|------|------|
| id | BIGINT | Chave Primária |
| order_id | FK | Pedido Pai |
| product_id | FK | Referência do Produto |
| product_name | VARCHAR | Snapshot do Nome do Produto |
| quantity | INT | Quantidade Pedida |
| unit_price | DECIMAL | Preço Unitário |
| discount_percent | DECIMAL | Porcentagem de Desconto |
| line_total | DECIMAL | Total do Item de Linha |
| notes | TEXT | Notas do Item de Linha |

### 7.4 Rastreamento de Pagamento

#### nb_crm_payments

| Campo | Tipo | Descrição |
|-----|------|------|
| id | BIGINT | Chave Primária |
| order_id | BIGINT | Pedido Associado (FK, Obrigatório) |
| customer_id | BIGINT | Cliente (FK) |
| payment_no | VARCHAR | Nº do Pagamento (Gerado automaticamente, Único) |
| amount | DECIMAL | Valor do Pagamento (Obrigatório) |
| currency | VARCHAR | Moeda do Pagamento |
| payment_method | VARCHAR | Método: transfer/check/cash/credit_card/lc |
| payment_date | DATE | Data do Pagamento |
| bank_account | VARCHAR | Número da Conta Bancária |
| bank_name | VARCHAR | Nome do Banco |
| notes | TEXT | Notas de Pagamento |

---

## 8. Ciclo de Vida do Cliente

### 8.1 Visão Geral do Cliente

Os clientes são criados durante a conversão de leads ou quando uma oportunidade é ganha. O sistema rastreia o ciclo de vida completo, desde a aquisição até a promoção (advocacy).
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)

### 8.2 Definições de Status do Cliente

| Status | Código | Saúde | Descrição |
|-----|------|--------|------|
| Potencial | `prospect` | N/A | Lead convertido, ainda sem pedidos |
| Ativo | `active` | ≥70 | Cliente pagante, boa interação |
| Em Crescimento | `growing` | ≥80 | Cliente com oportunidades de expansão |
| Em Risco | `at_risk` | <50 | Cliente mostrando sinais de churn |
| Perdido | `churned` | N/A | Não está mais ativo |
| Recuperação | `win_back` | N/A | Antigo cliente sendo reativado |
| Promotor | `advocate` | ≥90 | Alta satisfação, fornece indicações |

### 8.3 Pontuação de Saúde do Cliente

A saúde do cliente é calculada com base em múltiplos fatores:

| Fator | Peso | Métrica |
|-----|------|---------|
| Recência de Compra | 25% | Dias desde o último pedido |
| Frequência de Compra | 20% | Número de pedidos por período |
| Valor Monetário | 20% | Valor total e médio dos pedidos |
| Engajamento | 15% | Taxas de abertura de e-mail, participação em reuniões |
| Saúde do Suporte | 10% | Volume de tickets e taxa de resolução |
| Uso do Produto | 10% | Métricas de uso ativo (se aplicável) |

**Limiares de Saúde:**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 Segmentação de Clientes

#### Segmentação Automatizada

| Segmento | Condição | Ação Sugerida |
|-----|------|---------|
| VIP | LTV > $100K | Serviço diferenciado, patrocínio executivo |
| Enterprise | Tamanho da Empresa > 500 | Gerente de Conta Dedicado |
| Mid-Market | Tamanho da Empresa 50-500 | Check-ins regulares, suporte escalonado |
| Startup | Tamanho da Empresa < 50 | Recursos de autoatendimento, comunidade |
| Dormant | 90+ Dias Sem Atividade | Marketing de reativação |

---

## 9. Integração de E-mail

### 9.1 Visão Geral

O NocoBase fornece um plugin de integração de e-mail integrado que suporta Gmail e Outlook. Uma vez que os e-mails são sincronizados, os fluxos de trabalho podem acionar automaticamente a análise de IA do sentimento e intenção do e-mail, ajudando as vendas a entender rapidamente as atitudes dos clientes.

### 9.2 Sincronização de E-mail

**Provedores Suportados:**
- Gmail (via OAuth 2.0)
- Outlook/Microsoft 365 (via OAuth 2.0)

**Comportamento de Sincronização:**
- Sincronização bidirecional de e-mails enviados e recebidos.
- Associação automática de e-mails aos registros do CRM (Leads, Contatos, Oportunidades).
- Anexos armazenados no sistema de arquivos do NocoBase.

### 9.3 Associação E-mail-CRM (A ser finalizada)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 Modelos de E-mail

As vendas podem usar modelos predefinidos:

| Categoria do Modelo | Exemplos |
|---------|------|
| Abordagem Inicial | E-mail frio, Introdução calorosa, Acompanhamento de evento |
| Acompanhamento | Acompanhamento de reunião, Acompanhamento de proposta, Cutucada por falta de resposta |
| Cotação | Cotação anexada, Revisão de cotação, Cotação expirando |
| Pedido | Confirmação de pedido, Notificação de envio, Confirmação de entrega |
| Sucesso do Cliente | Boas-vindas, Check-in, Solicitação de avaliação |

---

## 10. Recursos Assistidos por IA

### 10.1 Equipe de Funcionários de IA

O sistema CRM integra o plugin de IA do NocoBase, utilizando os seguintes funcionários de IA integrados, configurados com tarefas específicas do CRM:

| ID | Nome | Papel Integrado | Recursos de Extensão do CRM |
|----|------|---------|-------------|
| viz | Viz | Analista de Dados | Análise de dados de vendas, previsão de pipeline |
| dara | Dara | Especialista em Gráficos | Visualização de dados, desenvolvimento de relatórios, design de painéis |
| ellis | Ellis | Editor | Redação de respostas de e-mail, resumos de comunicação, redação de e-mails comerciais |
| lexi | Lexi | Tradutor | Comunicação com clientes em vários idiomas, tradução de conteúdo |
| orin | Orin | Organizador | Prioridades diárias, sugestões de próximos passos, planejamento de acompanhamento |

### 10.2 Lista de Tarefas de IA

Os recursos de IA são divididos em duas categorias independentes:

#### I. Funcionários de IA (Acionados por Blocos de Frontend)

Os usuários interagem diretamente com a IA através de blocos de Funcionários de IA no frontend para obter análises e sugestões.

| Funcionário | Tarefa | Descrição |
|------|------|------|
| Viz | Análise de Dados de Vendas | Analisar tendências de pipeline e taxas de conversão |
| Viz | Previsão de Pipeline | Prever receita com base no pipeline ponderado |
| Dara | Geração de Gráficos | Gerar gráficos de relatórios de vendas |
| Dara | Design de Painéis | Projetar layouts de painéis de dados |
| Ellis | Redação de Respostas | Gerar respostas de e-mail profissionais |
| Ellis | Resumo de Comunicação | Resumir threads de e-mail |
| Ellis | Redação de E-mail Comercial | Convites para reuniões, acompanhamentos, e-mails de agradecimento, etc. |
| Orin | Prioridades Diárias | Gerar uma lista de tarefas prioritárias para o dia |
| Orin | Próxima Melhor Ação | Recomendar próximos passos para cada oportunidade |
| Lexi | Tradução de Conteúdo | Traduzir materiais de marketing, propostas e e-mails |

#### II. Nós de LLM em Fluxos de Trabalho (Execução Automatizada de Backend)

Nós de LLM aninhados em fluxos de trabalho, acionados automaticamente por eventos de coleção, eventos de ação ou tarefas agendadas, independentes dos Funcionários de IA.

| Tarefa | Método de Acionamento | Descrição | Campo Alvo |
|------|---------|------|---------|
| Pontuação de Lead | Evento de Coleção (Criar/Atualizar) | Avaliar a qualidade do lead | ai_score, ai_convert_prob |
| Previsão de Probabilidade de Ganho | Evento de Coleção (Mudança de Estágio) | Prever a probabilidade de sucesso da oportunidade | ai_win_probability, ai_risk_factors |

> **Nota**: Os nós de LLM de fluxo de trabalho usam prompts e saída de Schema para JSON estruturado, que é analisado e gravado nos campos de dados de negócio sem intervenção do usuário.

### 10.3 Campos de IA no Banco de Dados

| Tabela | Campo de IA | Descrição |
|----|--------|------|
| nb_crm_leads | ai_score | Pontuação IA 0-100 |
| | ai_convert_prob | Probabilidade de Conversão |
| | ai_best_contact_time | Melhor Horário de Contato |
| | ai_tags | Tags Geradas por IA (JSONB) |
| | ai_scored_at | Hora da Pontuação |
| | ai_next_best_action | Sugestão de Próxima Melhor Ação |
| | ai_nba_generated_at | Hora de Geração da Sugestão |
| nb_crm_opportunities | ai_win_probability | Probabilidade de Ganho Prevista por IA |
| | ai_analyzed_at | Hora da Análise |
| | ai_confidence | Confiança da Previsão |
| | ai_trend | Tendência: up/stable/down |
| | ai_risk_factors | Fatores de Risco (JSONB) |
| | ai_recommendations | Lista de Recomendações (JSONB) |
| | ai_predicted_close | Data de Fechamento Prevista |
| | ai_next_best_action | Sugestão de Próxima Melhor Ação |
| | ai_nba_generated_at | Hora de Geração da Sugestão |
| nb_crm_customers | ai_health_score | Pontuação de Saúde 0-100 |
| | ai_health_grade | Grau de Saúde: A/B/C/D |
| | ai_churn_risk | Risco de Churn 0-100% |
| | ai_churn_risk_level | Nível de Risco de Churn: low/medium/high |
| | ai_health_dimensions | Pontuações de Dimensões (JSONB) |
| | ai_recommendations | Lista de Recomendações (JSONB) |
| | ai_health_assessed_at | Hora da Avaliação de Saúde |
| | ai_tags | Tags Geradas por IA (JSONB) |
| | ai_best_contact_time | Melhor Horário de Contato |
| | ai_next_best_action | Sugestão de Próxima Melhor Ação |
| | ai_nba_generated_at | Hora de Geração da Sugestão |

---

## 11. Mecanismo de Fluxo de Trabalho

### 11.1 Fluxos de Trabalho Implementados

| Nome do Fluxo de Trabalho | Tipo de Acionamento | Status | Descrição |
|-----------|---------|------|------|
| Leads Criados | Evento de Coleção | Ativado | Acionado quando um lead é criado |
| Análise Geral do CRM | Evento de Funcionário de IA | Ativado | Análise geral de dados do CRM |
| Conversão de Lead | Evento Pós-ação | Ativado | Processo de conversão de lead |
| Atribuição de Lead | Evento de Coleção | Ativado | Atribuição automatizada de leads |
| Pontuação de Lead | Evento de Coleção | Desativado | Pontuação de lead (A ser finalizada) |
| Lembrete de Acompanhamento | Tarefa Agendada | Desativado | Lembretes de acompanhamento (A ser finalizados) |

### 11.2 Fluxos de Trabalho a Implementar

| Fluxo de Trabalho | Tipo de Acionamento | Descrição |
|-------|---------|------|
| Avanço de Estágio da Oportunidade | Evento de Coleção | Atualizar probabilidade de ganho e registrar tempo no estágio na mudança |
| Detecção de Estagnação de Oportunidade | Tarefa Agendada | Detectar oportunidades inativas e enviar lembretes |
| Aprovação de Cotação | Evento Pós-ação | Processo de aprovação em vários níveis |
| Geração de Pedido | Evento Pós-ação | Gerar pedido automaticamente após aceitação da cotação |

---

## 12. Design de Menu e Interface

### 12.1 Estrutura Administrativa

| Menu | Tipo | Descrição |
|------|------|------|
| **Painéis (Dashboards)** | Grupo | Painéis |
| - Painel | Página | Painel Padrão |
| - Gerente de Vendas | Página | Visão do Gerente de Vendas |
| - Rep de Vendas | Página | Visão do Representante de Vendas |
| - Executivo | Página | Visão Executiva |
| **Leads** | Página | Gestão de Leads |
| **Clientes** | Página | Gestão de Clientes |
| **Oportunidades** | Página | Gestão de Oportunidades |
| - Tabela | Aba | Lista de Oportunidades |
| **Produtos** | Página | Gestão de Produtos |
| - Categorias | Aba | Categorias de Produtos |
| **Pedidos** | Página | Gestão de Pedidos |
| **Configurações** | Grupo | Configurações |
| - Config. de Estágios | Página | Configuração de Estágios de Oportunidade |
| - Taxa de Câmbio | Página | Configurações de Taxa de Câmbio |
| - Atividade | Página | Registros de Atividade |
| - E-mails | Página | Gestão de E-mail |
| - Contatos | Página | Gestão de Contatos |
| - Análise de Dados | Página | Análise de Dados |

### 12.2 Visualizações de Painel

#### Visão do Gerente de Vendas

| Componente | Tipo | Dados |
|-----|------|------|
| Valor do Pipeline | Cartão KPI | Valor total do pipeline por estágio |
| Ranking da Equipe | Tabela | Ranking de desempenho dos representantes |
| Alertas de Risco | Lista de Alertas | Oportunidades de alto risco |
| Tendência de Taxa de Ganho | Gráfico de Linhas | Taxa de ganho mensal |
| Negócios Estagnados | Lista | Negócios que exigem atenção |

#### Visão do Representante de Vendas

| Componente | Tipo | Dados |
|-----|------|------|
| Progresso da Minha Meta | Barra de Progresso | Real Mensal vs. Meta |
| Oportunidades Pendentes | Cartão KPI | Contagem das minhas oportunidades pendentes |
| Fechando Esta Semana | Lista | Negócios com previsão de fechamento próximo |
| Atividades Atrasadas | Alerta | Tarefas expiradas |
| Ações Rápidas | Botões | Registrar atividade, Criar oportunidade |

#### Visão Executiva

| Componente | Tipo | Dados |
|-----|------|------|
| Receita Anual | Cartão KPI | Receita acumulada no ano |
| Valor do Pipeline | Cartão KPI | Valor total do pipeline |
| Taxa de Ganho | Cartão KPI | Taxa de ganho geral |
| Saúde do Cliente | Distribuição | Distribuição da pontuação de saúde |
| Previsão | Gráfico | Previsão de receita mensal |

---

*Versão do Documento: v2.0 | Atualizado em: 06-02-2026*