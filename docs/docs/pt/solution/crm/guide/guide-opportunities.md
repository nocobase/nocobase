---
title: "Oportunidades e cotações"
description: "Guia de operação da gestão de Oportunidades do CRM: visualização em kanban, avanço de etapas, criação de cotações, suporte a múltiplas moedas e fluxo de aprovação."
keywords: "gestão de Oportunidades,funil de vendas,kanban,aprovação de cotações,múltiplas moedas,NocoBase CRM"
---

# Oportunidades e cotações

> A Oportunidade é o coração do processo de vendas — representa um negócio que pode fechar. Neste capítulo, você vai aprender a usar o kanban para avançar etapas das Oportunidades, criar cotações, percorrer o fluxo de aprovação e, por fim, transformar a cotação em Pedido oficial.

![cn_02-opportunities](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_02-opportunities.png)

## Visão geral da página de Oportunidades

Pelo menu lateral esquerdo, acesse **Vendas → Opportunities**. No topo da página há duas abas:

- **Kanban Pipeline**: exibe todas as Oportunidades por etapa em formato de kanban, ideal para acompanhamento diário e avanço rápido.
- **Tabela**: exibe as Oportunidades em formato de lista, ideal para filtragem em massa e exportação de dados.

O kanban Pipeline é aberto por padrão — também é a visão mais utilizada pelos vendedores.

![02-opportunities-2026-04-07-00-56-47](https://static-docs.nocobase.com/02-opportunities-2026-04-07-00-56-47.png)

## Kanban Pipeline

### Barra de filtros

No topo do kanban, há uma fileira de botões de filtro que ajudam a focar rapidamente em diferentes conjuntos de Oportunidades:

| Botão | Função |
|------|------|
| **All Pipeline** | Mostra todas as Oportunidades em andamento |
| **My Deals** | Mostra apenas as Oportunidades atribuídas a você |
| **Big Deals** | Negócios grandes, com valor ≥ US$ 50K |
| **Closing Soon** | Oportunidades previstas para fechar em até 30 dias |

A barra de filtros também inclui **2 cartões de estatísticas** — Open Deals (Oportunidades em andamento) e Pipeline Value (valor total do pipeline) — e uma **caixa de busca em tempo real**: digite o nome da Oportunidade, do Cliente ou do responsável para localizar rapidamente.

:::tip
Esses botões de filtro usam a capacidade de interação entre blocos do NocoBase (`initResource` + `addFilterGroup`), filtrando em tempo real os dados do kanban sem precisar atualizar a página.
:::

![02-opportunities-2026-04-07-01-00-37](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-00-37.gif)

### Colunas do kanban

O kanban tem **6 colunas**, correspondentes às 6 etapas da Oportunidade:

```
Prospecting → Analysis → Proposal → Negotiation → Won → Lost
  Prospecção   Análise de   Proposta    Negociação    Ganha   Perdida
              necessidade
```

A barra de título de cada coluna mostra: nome da etapa, quantidade de Oportunidades nessa etapa, valor total e um botão "+" para adicionar rapidamente.

Cada cartão exibe as seguintes informações:

- **Nome da Oportunidade**: por exemplo, "Projeto ERP da empresa X"
- **Nome do Cliente**: empresa do Cliente associada
- **Valor estimado**: por exemplo, US$ 50K
- **Probabilidade de ganho**: exibida como tag colorida (verde = alta, amarelo = média, vermelho = baixa)
- **Avatar do responsável**: quem está acompanhando essa Oportunidade

### Avançar etapas por arrastar e soltar

A forma mais intuitiva de operar: **arraste o cartão de uma coluna para outra** e o sistema atualiza automaticamente a etapa da Oportunidade.

Por exemplo, ao concluir a análise de necessidade e estar prestes a enviar a proposta, basta arrastar o cartão de Analysis para Proposal.

![02-opportunities-2026-04-07-01-02-09](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-02-09.gif)

## Visualização em tabela

Ao mudar para a aba de tabela, você vê uma tabela de dados padrão.

### Botões de filtro

Acima da tabela há também um conjunto de botões de filtro:

- **All**: todas as Oportunidades
- **In Pipeline**: Oportunidades em andamento (excluindo as fechadas e perdidas)
- **Closing Soon**: prestes a vencer
- **Won**: ganhas
- **Lost**: perdidas

Cada botão vem acompanhado de um **contador**, permitindo ver de relance a distribuição de Oportunidades por status.

Na parte inferior da tabela há uma **linha de totais**: mostra a soma dos valores das Oportunidades selecionadas/totais e tags com a distribuição por etapa, facilitando a leitura geral.

### Ver detalhes

Clique em qualquer linha da tabela para abrir o modal de detalhes da Oportunidade — essa é a interface principal para gerenciar uma Oportunidade individual.

![02-opportunities-2026-04-07-01-05-05](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-05-05.png)

## Detalhes da Oportunidade

O modal de detalhes da Oportunidade é a interface mais densa em informações. De cima para baixo, contém os seguintes módulos:

![02-opportunities-2026-04-07-01-05-42](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-05-42.png)


### Barra de fluxo de etapas

No topo dos detalhes há uma **barra de etapas interativa** (componente Steps), exibindo claramente em qual etapa a Oportunidade se encontra.

Você pode **clicar diretamente em uma das etapas** da barra para avançar a Oportunidade. Ao clicar em **Won** ou **Lost**, o sistema abre um diálogo de confirmação, pois ambas são operações em estado final e não podem ser desfeitas livremente.

![02-opportunities-2026-04-07-01-06-54](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-06-54.gif)

### Indicadores principais

Abaixo da barra de etapas, são exibidos quatro indicadores essenciais:

| Indicador | Descrição |
|------|------|
| **Valor estimado** | Valor estimado de fechamento dessa Oportunidade |
| **Data prevista de fechamento** | Quando se planeja fechar |
| **Dias na etapa atual** | Há quanto tempo a Oportunidade está parada na etapa atual (útil para identificar Oportunidades estagnadas) |
| **Probabilidade de ganho por AI** | Probabilidade de fechamento calculada pelo sistema com base em dados multidimensionais |

### Análise de risco por AI

Esta é uma das funcionalidades de destaque do CRM. O sistema analisa automaticamente a saúde da Oportunidade e exibe:

- **Anel de probabilidade**: gráfico circular mostrando intuitivamente a probabilidade de fechamento
- **Lista de fatores de risco**: por exemplo, "Sem contato com o Cliente há mais de 14 dias", "Cotação do concorrente está mais baixa" etc.
- **Ações recomendadas**: sugestões da AI para o próximo passo, como "Agende uma demonstração de produto"


### Lista de cotações
![02-opportunities-2026-04-07-01-16-19](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-16-19.png)
A parte central dos detalhes mostra **todas as cotações associadas a essa Oportunidade**, em formato de subtabela. Cada linha exibe número da cotação, valor, status etc.; o status de aprovação é apresentado em tags visuais (rascunho, em aprovação, aprovada, rejeitada).

### Comentários e anexos

À direita dos detalhes ficam as áreas de comentários e anexos, onde os membros da equipe podem trocar atualizações e enviar arquivos relacionados.
![02-opportunities-2026-04-07-01-17-01](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-17-01.png)

## Criar uma cotação

Pronto para enviar uma cotação ao Cliente? O fluxo é o seguinte:

**Passo 1**: abra os detalhes da Oportunidade e localize a área de cotações.

**Passo 2**: clique no botão **Add new** (Adicionar) e o sistema abre o formulário de cotação.

**Passo 3**: preencha as informações básicas da cotação, como nome e data de validade.

**Passo 4**: na **subtabela de detalhes de Produto**, adicione os itens da cotação:

| Campo | Descrição |
|------|------|
| **Produto** | Selecione no catálogo de Produtos |
| **Especificação** | Somente leitura, preenchida automaticamente após selecionar o Produto |
| **Unidade** | Somente leitura, preenchida automaticamente |
| **Quantidade** | Quantidade da cotação |
| **Preço de tabela** | Somente leitura, preço de tabela do catálogo |
| **Preço unitário** | Somente leitura, ajustado automaticamente conforme a faixa de preço por quantidade |
| **Taxa de desconto** | Somente leitura, desconto da faixa de preço |
| **Valor da linha** | Calculado automaticamente |

O sistema executa automaticamente a cadeia de cálculo: subtotal → desconto → impostos → frete → total → valor equivalente em USD. O formulário inclui um JS Block com dicas mostrando as regras de preenchimento automático e as fórmulas de cálculo.

**Passo 5**: se o Cliente operar em outra moeda que não USD, escolha a moeda correspondente. Ao criar, o sistema **trava a taxa de câmbio atual** e converte automaticamente para o valor equivalente em USD, garantindo que a conciliação posterior não seja afetada por variações cambiais.

**Passo 6**: após confirmar as informações, clique em enviar para salvar a cotação. Nesse momento, o status da cotação é **Draft (rascunho)**.

![02-opportunities-2026-04-07-01-09-11](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-09-11.gif)

## Fluxo de aprovação da cotação

Após criada, a cotação não entra em vigor diretamente — ela passa por um fluxo de aprovação para garantir que o valor seja razoável e que os descontos estejam dentro da alçada autorizada.

### Visão geral do fluxo

```
Draft (rascunho) → Pending Approval (em aprovação) → Manager Review (revisão pelo gerente) → Approved / Rejected / Returned
```

![02-opportunities-2026-04-07-01-09-38](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-09-38.png)

### Submeter para aprovação

**Passo 1**: nos detalhes da Oportunidade, localize a cotação com status Draft e clique no botão **Submit for Approval** (Enviar para aprovação).

:::note
Esse botão **só é exibido quando o status da cotação é Draft**. Cotações já enviadas ou aprovadas não exibem esse botão.
:::

**Passo 2**: o sistema atualiza automaticamente o status da cotação para **Pending Approval** e dispara o workflow de aprovação.

**Passo 3**: o gerente designado recebe a notificação da tarefa de aprovação no sistema.

![02-opportunities-2026-04-07-01-12-20](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-12-20.png)

### Aprovação pelo gerente

Ao abrir a tarefa de aprovação, o gerente vê o seguinte:

**Cartão de aprovação**: mostra as informações-chave da cotação — número, nome, valor (na moeda local + equivalente em USD), status atual.

**Detalhes da aprovação**: apresenta o conteúdo completo da cotação em modo somente leitura, incluindo:
- Informações básicas (nome da cotação, validade, moeda)
- Vínculo com Cliente e Oportunidade
- Subtabela de detalhes de Produto (Produto, quantidade, preço unitário, desconto, subtotal)
- Valor consolidado
- Termos e observações

**Botões de ação**: o gerente pode executar as seguintes ações:

| Ação | Efeito |
|------|------|
| **Approve (Aprovar)** | Status muda para Approved |
| **Reject (Rejeitar)** | Status muda para Rejected, com motivo obrigatório |
| **Return (Devolver)** | Cotação retorna ao criador para alterações; status volta para Draft |
| **Add Approver (Adicionar aprovador)** | Inclui mais um aprovador |
| **Transfer (Transferir)** | Transfere a tarefa de aprovação para outra pessoa |

![02-opportunities-2026-04-07-01-13-04](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-13-04.png)

### Tratamento do resultado da aprovação

- **Aprovada**: status muda para Approved e a cotação pode seguir para a próxima etapa — virar Pedido oficial.
- **Rejeitada / Devolvida**: status volta para Draft; o criador pode editar e reenviar para aprovação.

![02-opportunities-2026-04-07-01-13-25](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-13-25.png)

## Cotação para Pedido

Quando o status da cotação é **Approved (aprovada)**, na área de ações da cotação aparece o botão **New Order** (criar Pedido).

:::note
Esse botão **só é exibido quando o status da cotação é Approved**. Cotações em rascunho ou em aprovação não exibem esse botão.
:::

Ao clicar em **New Order**, o sistema cria automaticamente um rascunho de Pedido com base nos dados da cotação, incluindo detalhes de Produto, valores, informações do Cliente etc., evitando o trabalho de redigitação.

![02-opportunities-2026-04-07-01-14-41](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-14-41.png)

---

Depois que a cotação é aprovada, ela já pode ser convertida em Pedido oficial. Em seguida, vá para [Gestão de Pedidos](./guide-products-orders) para conhecer o fluxo posterior do Pedido.

## Páginas relacionadas

- [Guia de operação do CRM](./index.md)
- [Gestão de Leads](./guide-leads)
- [Gestão de Pedidos](./guide-products-orders)
