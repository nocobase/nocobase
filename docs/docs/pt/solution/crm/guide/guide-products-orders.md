---
title: "Produtos, cotações e Pedidos"
description: "Guia de operação do catálogo de Produtos do CRM, cotações (com fluxo de aprovação) e gestão de Pedidos: do cadastro do Produto à aprovação da cotação até a entrega do Pedido."
keywords: "gestão de Produtos,cotação,gestão de Pedidos,fluxo de aprovação,múltiplas moedas,NocoBase CRM"
---

# Produtos, cotações e Pedidos

> Este capítulo cobre a segunda metade do processo de vendas: manutenção do catálogo de Produtos, criação e aprovação de cotações e acompanhamento de entrega e recebimento dos Pedidos. As cotações também são abordadas em [Gestão de Oportunidades](./guide-opportunities) (na perspectiva da Oportunidade); este capítulo foca na perspectiva de Produto e Pedido.

![cn_03-products-orders](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_03-products-orders.png)

## Catálogo de Produtos

Pelo menu superior, acesse a página **Produtos**, que contém duas abas:

### Lista de Produtos

À esquerda há a árvore de categorias (filtro JS) e à direita a tabela de Produtos. Cada Produto contém: nome, código, categoria, especificação, unidade, preço de tabela, custo e moeda.

![03-products-orders-2026-04-07-01-18-03](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-18-03.png)

Ao criar um Produto, além das informações básicas, é possível configurar a **subtabela de preços por faixa**:

| Campo | Descrição |
|------|------|
| Moeda | Moeda do preço |
| Quantidade mínima | Quantidade inicial dessa faixa de preço |
| Quantidade máxima | Quantidade máxima dessa faixa de preço |
| Preço unitário | Preço unitário correspondente a essa faixa |
| Taxa de desconto | Percentual de desconto por volume |


![03-products-orders-2026-04-07-01-18-51](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-18-51.png)

Ao criar uma cotação, ao escolher o Produto, o sistema seleciona automaticamente a faixa de preço de acordo com a quantidade.

![03-products-orders-2026-04-07-01-19-39](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-19-39.png)

### Gestão de categorias

A segunda aba é uma tabela em árvore das categorias de Produto, com suporte a aninhamento em vários níveis. Clique em "Adicionar subcategoria" para criar uma subcategoria sob o nó atual.

![03-products-orders-2026-04-07-01-20-19](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-20-19.png)

---

## Cotações

A cotação é geralmente criada nos detalhes da Oportunidade (consulte a seção "Criar uma cotação" em [Oportunidades e cotações](./guide-opportunities)); aqui complementamos com os detalhes de Produto e o fluxo de aprovação.

### Detalhes de Produto

Na subtabela de itens da cotação, ao escolher o Produto, vários campos são preenchidos automaticamente:

| Campo | Descrição |
|------|------|
| **Produto** | Selecione no catálogo de Produtos |
| **Especificação** | Somente leitura, preenchida automaticamente após selecionar o Produto |
| **Unidade** | Somente leitura, preenchida automaticamente |
| **Quantidade** | Preenchida manualmente |
| **Preço de tabela** | Somente leitura, preço de tabela do catálogo |
| **Preço unitário** | Somente leitura, ajustado automaticamente conforme a faixa de preço por quantidade |
| **Taxa de desconto** | Somente leitura, desconto da faixa de preço |
| **Valor da linha** | Calculado automaticamente |

![03-products-orders-2026-04-07-01-22-22](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-22-22.gif)

O sistema executa automaticamente a cadeia de cálculo: subtotal → desconto → impostos → frete → total → valor equivalente em USD.

![03-products-orders-2026-04-07-01-23-13](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-23-13.gif)

### Suporte a múltiplas moedas

Se o Cliente operar em outra moeda que não USD, escolha a moeda correspondente. Ao criar, o sistema **trava a taxa de câmbio atual** e converte automaticamente para o valor equivalente em USD. As taxas de câmbio são mantidas em **Configurações → Taxas de câmbio**.

### Aprovação

Após a criação, a cotação passa por aprovação; uma vez aprovada, gera o Pedido.

---

## Gestão de Pedidos

Pelo menu superior, acesse a página **Pedidos**. Também é possível criar um Pedido diretamente nos detalhes da Oportunidade, clicando em "New Order" em uma cotação aprovada.

### Lista de Pedidos

No topo da página há botões de filtro:

| Botão | Significado |
|------|------|
| **Todos** | Todos os Pedidos |
| **Em processamento** | Pedidos em execução |
| **Aguardando pagamento** | Aguardando pagamento do Cliente |
| **Enviados** | Já enviados, aguardando confirmação de recebimento |
| **Concluídos** | Fluxo encerrado |

![03-products-orders-2026-04-07-01-25-09](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-25-09.png)

### Coluna de progresso do Pedido

A coluna "Progresso do Pedido" usa uma barra visual de pontos e linhas para mostrar o status atual:

```
Aguardando confirmação → Confirmado → Em processamento → Enviado → Concluído
```

As etapas concluídas ficam destacadas e as ainda não atingidas ficam em cinza.

### Linha de totais

Informações na linha de totais ao final da tabela:

- **Valor selecionado / valor total dos Pedidos**
- **Distribuição por status de pagamento** (em formato de tags)
- **Distribuição por status do Pedido** (em formato de tags)

![03-products-orders-2026-04-07-01-25-51](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-25-51.png)

### Criar Pedido

**A partir de uma cotação (recomendado)**: nos detalhes da Oportunidade, cotações com status Approved exibem o botão "New Order"; ao clicar, o sistema preenche automaticamente Cliente, detalhes de Produto, valores, moeda, taxa de câmbio etc.

![03-products-orders-2026-04-07-01-27-16](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-27-16.png)

**Criação manual**: na página da lista de Pedidos, clique em "Novo"; é necessário preencher Cliente, detalhes de Produto, valor do Pedido e condições de pagamento.

### Avanço do status do Pedido

Clique no Pedido para abrir o modal de detalhes; no topo há um fluxo de status interativo: clique no próximo nó para avançar. Cada mudança de status é registrada pelo sistema.

![03-products-orders-2026-04-07-01-27-50](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-27-50.png)

### Acompanhamento de pagamentos

O status do Pedido e o status de pagamento são duas trilhas independentes:

- **Status do Pedido**: confirmação → processamento → envio → conclusão (fluxo de entrega)
- **Status do pagamento**: aguardando pagamento → pagamento parcial → pago (fluxo de recebimento)

Atualmente focamos no fluxo de front-end do CRM e não impomos restrições condicionais sobre o status do Pedido — ele serve apenas como item de registro. Caso seja necessário, é possível impor controles via regras de interação ou eventos da tabela de dados.

---

Quando o Pedido é concluído, o ciclo de vendas se fecha. A seguir, conheça a gestão de [Clientes, contatos e e-mails](./guide-customers-emails).

## Páginas relacionadas

- [Guia de operação do CRM](./index.md)
- [Gestão de Oportunidades](./guide-opportunities) — operação de cotações na perspectiva da Oportunidade
- [Clientes, contatos e e-mails](./guide-customers-emails)
- [Dashboards](./guide-overview) — drill-through dos dados de Pedido
