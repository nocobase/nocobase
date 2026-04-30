---
title: "Clientes, contatos e e-mails"
description: "Visão 360 do Cliente no CRM, score de saúde por AI, mesclagem de Clientes, gestão de papéis de contatos, envio e recebimento de e-mails com suporte de AI e registro de atividades."
keywords: "gestão de Clientes,contatos,e-mails,score de saúde,mesclagem de Clientes,NocoBase CRM"
---

# Clientes, contatos e e-mails

> Clientes, contatos e e-mails são três módulos fortemente conectados — o Cliente é o sujeito, o contato é o interlocutor e o e-mail é o registro da comunicação. Este capítulo apresenta os três de forma integrada.

![cn_04-customers-emails](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_04-customers-emails.png)

## Gestão de Clientes

Pelo menu superior, acesse a página **Clientes**, que contém duas abas: lista de Clientes e ferramenta de mesclagem.

### Lista de Clientes

Acima da lista há botões de filtro:

| Filtro | Descrição |
|---------|------|
| **All** | Todos os Clientes |
| **Active** | Clientes ativos |
| **Potential** | Clientes potenciais, ainda sem fechamento |
| **Dormant** | Clientes inativos, sem interação por longo período |
| **Key Accounts** | Grandes Clientes / Clientes-chave |
| **New This Month** | Novos Clientes do mês |


![04-customers-emails-2026-04-07-01-32-03](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-32-03.png)


**Colunas principais**:

- **Score de saúde por AI**: barra de progresso circular de 0 a 100 (🟢 70–100 saudável / 🟡 40–69 alerta / 🔴 0–39 crítico)
- **Atividade recente**: tempo relativo + codificação por cor; quanto mais tempo sem contato, mais escura a cor

### Detalhes do Cliente

Clique no nome do Cliente para abrir o modal de detalhes, que contém **3 abas**:

| Aba | Conteúdo |
|-------|------|
| **Detalhes** | Perfil do Cliente, cartões de estatísticas, contatos, Oportunidades, comentários |
| **E-mails** | E-mails trocados com todos os contatos desse Cliente, com 5 botões de AI |
| **Histórico de alterações** | Log de auditoria em nível de campo |

A aba **Detalhes** usa um layout de duas colunas (2/3 à esquerda + 1/3 à direita):

- **Coluna esquerda**: avatar do Cliente (cor por nível: Normal=cinza, Important=âmbar, VIP=dourado), resumo em 4 colunas (nível/porte/região/tipo), cartões de estatísticas (valor total fechado / Oportunidades ativas / interações no mês, com consulta em tempo real via API), lista de contatos, lista de Oportunidades e área de comentários
- **Coluna direita**: perfil inteligente por AI (tags de AI, gráfico circular de saúde, risco de churn, melhor horário de contato, estratégia de comunicação)

![04-customers-emails-2026-04-07-01-33-47](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-33-47.png)

### Score de saúde por AI

O score de saúde é calculado automaticamente combinando as seguintes dimensões: frequência de interação, atividade das Oportunidades, situação dos Pedidos e cobertura dos contatos.

Recomendações de uso:

1. Abra a lista de Clientes diariamente e ordene pelo score de saúde
2. Priorize os Clientes em vermelho (Critical) — podem estar prestes a sair
3. Clientes em amarelo (Warning) — agende um acompanhamento leve
4. Clientes em verde (Healthy) — manutenção em ritmo normal

### Mesclagem de Clientes

Quando houver registros de Clientes duplicados, use a ferramenta de mesclagem para limpar:

1. **Iniciar mesclagem**: na lista de Clientes, selecione vários Clientes → clique no botão "Customer Merge"
2. **Acessar a ferramenta de mesclagem**: vá para a segunda aba e veja a lista de solicitações de mesclagem (Pending / Merged / Cancelled)
3. **Executar a mesclagem**: escolha o registro principal (Master) → compare diferenças campo a campo → visualize → confirme. O workflow em background migra automaticamente todos os dados associados (Oportunidades, contatos, atividades, comentários, Pedidos, cotações, compartilhamentos) e desativa o Cliente mesclado

![04-customers-emails-2026-04-07-01-35-37](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-35-37.png)

![04-customers-emails-2026-04-07-01-38-07](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-07.png)

:::tip[Confira com cuidado antes de mesclar]
A mesclagem de Clientes é irreversível. Antes de executar, confirme cuidadosamente a escolha do registro principal e os valores de cada campo.
:::


![04-customers-emails-2026-04-07-01-37-44](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-37-44.gif)

---

## Gestão de contatos

Pelo menu superior, acesse a página **Configurações → Contatos**.

### Informações do contato

| Campo | Descrição |
|------|------|
| Name | Nome do contato |
| Company | Empresa associada (registro de Cliente vinculado) |
| Email | Endereço de e-mail (usado para associação automática de e-mails) |
| Phone | Número de telefone |
| Role | Tag de papel |
| Level | Nível do contato |
| Primary Contact | Se é o contato principal desse Cliente |

### Tags de papel

| Papel | Significado |
|------|------|
| Decision Maker | Tomador de decisão |
| Influencer | Influenciador |
| Technical | Responsável técnico |
| Procurement | Responsável por compras |

![04-customers-emails-2026-04-07-01-38-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-26.png)

### Enviar e-mail a partir do contato

Abra a página de detalhes do contato. Assim como em outras páginas de gestão de dados, ela contém abas de detalhes, e-mails, registros de campos etc.

![04-customers-emails-2026-04-07-01-38-52](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-52.png)

---

### Associação entre e-mails e CRM

Os e-mails são associados automaticamente a Clientes, contatos e Oportunidades:

- Aba "E-mails" no detalhe do Cliente → e-mails trocados com todos os contatos desse Cliente
- Detalhe do contato → histórico completo de e-mails desse contato
- Detalhe da Oportunidade → registros de comunicação relacionados

A associação é feita por meio de view, com correspondência automática pelo endereço de e-mail do contato.

![04-customers-emails-2026-04-07-01-40-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-40-26.png)

![04-customers-emails-2026-04-07-01-41-13](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-13.png)

### Suporte de AI para e-mails

A página de e-mails oferece 6 cenários de suporte de AI:

| Cenário | Funcionalidade |
|------|------|
| **Rascunho de proposta** | A AI gera o e-mail de proposta com base no contexto do Cliente e da Oportunidade |
| **E-mail de acompanhamento** | A AI gera um e-mail de acompanhamento com tom adequado |
| **Análise de e-mail** | A AI analisa o tom emocional e os pontos-chave do e-mail |
| **Resumo de e-mail** | A AI gera um resumo da thread de e-mails |
| **Contexto do Cliente** | A AI consolida as informações de fundo do Cliente |
| **Briefing executivo** | A AI extrai as informações-chave da thread e gera um briefing |

![04-customers-emails-2026-04-07-01-41-46](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-46.png)

---

## Registro de atividades

Pelo menu superior, acesse **Configurações → Atividades**. Esse é o log central de todas as interações com Clientes.

| Tipo de atividade | Descrição |
|---------|------|
| Meeting | Reunião |
| Call | Ligação |
| Email | E-mail |
| Visit | Visita |
| Note | Anotação |
| Task | Tarefa |

![04-customers-emails-2026-04-07-01-42-20](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-42-20.png)

Os registros de atividades também aparecem na visualização de calendário do dashboard Overview.

---

## Páginas relacionadas

- [Guia de operação do CRM](./index.md)
- [Gestão de Leads](./guide-leads) — após a conversão do Lead, Cliente e contato são criados automaticamente
- [Gestão de Oportunidades](./guide-opportunities) — Oportunidades vinculadas ao Cliente
- [Funcionários de AI](./guide-ai)
