---
pkg: '@nocobase/plugin-workflow-transaction'
title: "Nó de fluxo de trabalho - Transação de banco de dados"
description: "Nó de transação de banco de dados: executa operações de dados da mesma fonte em uma transação, confirma em caso de sucesso e reverte em caso de falha."
keywords: "fluxo de trabalho,transação de banco de dados,Transaction,rollback,commit,operação de dados,NocoBase"
---

# Transação de banco de dados

## Introdução

O nó de transação de banco de dados executa um conjunto de operações de banco de dados na mesma transação. Ele é adequado para cenários em que várias etapas de dados devem ter sucesso juntas ou ser revertidas por completo, como criar um pedido, reduzir estoque, gravar detalhes e atualizar status.

Atualmente, o nó de transação oferece suporte apenas a fontes de dados de banco de dados. As operações de dados da mesma fonte dentro do nó são incluídas automaticamente nessa transação; outras fontes de dados não usam essa transação.

## Criar nó

Na interface de configuração do fluxo de trabalho, clique no botão de adição ("+") no fluxo para adicionar um nó "Transação de banco de dados".

![20260610205146](https://static-docs.nocobase.com/20260610205146.png)

Após a criação, duas ramificações são geradas:

- **Executar**: ramificação principal executada dentro da transação. Se todos os nós dessa ramificação forem bem-sucedidos, a transação será confirmada automaticamente. Se qualquer nó falhar ou gerar erro, a transação será revertida automaticamente.
- **Após rollback**: ramificação executada após a reversão. Essa ramificação é executada fora da transação e pode ser usada para registrar logs, enviar notificações ou executar tratamento de compensação.

![20260610205303](https://static-docs.nocobase.com/20260610205303.png)

## Configuração do nó

![20260610205505](https://static-docs.nocobase.com/20260610205505.png)

### Fonte de dados

Selecione a fonte de dados de banco de dados controlada por esta transação. Somente nós de operação de dados da mesma fonte de dados são incluídos automaticamente na transação.

### Nível de isolamento

Defina o nível de isolamento da transação. O valor padrão é `READ UNCOMMITTED`. Se o negócio exigir consistência de dados mais rigorosa, escolha outro nível de isolamento de acordo com as capacidades do banco de dados e os requisitos de concorrência.

### Continuar fluxo de trabalho após rollback

Quando ativado, o fluxo de trabalho continua para os nós após o nó de transação depois que a ramificação `Após rollback` termina.

Quando desativado, o fluxo de trabalho para no nó de transação depois que a ramificação `Após rollback` termina, e os nós seguintes não são executados.

## Uso

### Restrições

A ramificação `Executar` não oferece suporte a nós assíncronos que suspendem o fluxo de trabalho, como processamento manual e atraso. A transação precisa ser confirmada ou revertida durante a execução atual. Se a ramificação `Executar` entrar em estado de espera, o sistema reverte a transação e marca o fluxo de trabalho como falho.

A ramificação `Após rollback` é executada fora da transação, portanto não está sujeita à restrição acima. Você pode usar nós assíncronos nessa ramificação conforme necessário, por exemplo para enviar requisições, aguardar confirmação manual ou atrasar o processamento.

:::warning Observação
Transações ocupam conexões de banco de dados até serem confirmadas ou revertidas. Evite operações demoradas na ramificação `Executar` e mantenha ali apenas leituras, escritas e verificações de dados necessárias.
:::

### Transações aninhadas

Nós de transação podem ser aninhados, mas é necessário observar o escopo da fonte de dados:

- Se as transações interna e externa usarem a mesma fonte de dados, a transação interna será criada dentro do escopo da transação externa e processada de acordo com as capacidades do banco de dados e do Sequelize.
- Se a transação interna usar uma fonte de dados diferente, ela não reutilizará a transação externa e criará uma transação independente para essa fonte de dados.
- Se o fluxo de trabalho for acionado por um evento de coleção síncrono, o próprio gatilho pode já fornecer uma transação de nível superior para a mesma fonte de dados. O nó de transação reutiliza preferencialmente a transação externa da mesma fonte de dados e não reutiliza transações de fontes diferentes.

Transações aninhadas aumentam o custo de entendimento e diagnóstico. Em geral, use-as apenas quando realmente precisar de um limite local de rollback. Caso contrário, prefira envolver todo o fluxo de processamento de dados em um único nó de transação.

### Cenário comum

Um fluxo típico é:

1. Consultar ou criar dados relacionados na ramificação `Executar`.
2. Continuar atualizando estoque, status, detalhes e outros dados da mesma fonte na ramificação `Executar`.
3. Se tudo for bem-sucedido, a transação será confirmada automaticamente.
4. Se qualquer nó falhar ou gerar erro, a transação será revertida automaticamente e o fluxo entrará na ramificação `Após rollback`.
5. Na ramificação `Após rollback`, registrar o motivo da falha, enviar notificações ou executar lógica de compensação.

Se precisar continuar o fluxo após o rollback, ative "Continuar fluxo de trabalho após rollback".
