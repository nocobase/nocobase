:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Múltiplas Condições <Badge>v2.0.0+</Badge>

## Introdução

Similar às instruções `switch / case` ou `if / else if` em linguagens de programação. O sistema avalia as múltiplas condições configuradas sequencialmente. Assim que uma condição é atendida, o fluxo de trabalho executa a ramificação correspondente e ignora as verificações de condições subsequentes. Se nenhuma condição for atendida, a ramificação "Caso Contrário" é executada.

## Criar Nó

Na interface de configuração do fluxo de trabalho, clique no botão de adição ('+') no fluxo para adicionar um nó de "Múltiplas Condições":

![Criar Nó de Múltiplas Condições](https://static-docs.nocobase.com/20251123222134.png)

## Gerenciamento de Ramificações

### Ramificações Padrão

Após a criação, o nó inclui duas ramificações por padrão:

1.  **Ramificação de Condição**: Para configurar condições de julgamento específicas.
2.  **Ramificação Caso Contrário**: Entra nesta ramificação quando nenhuma das ramificações de condição é atendida; não requer configuração de condição.

Clique no botão "Adicionar ramificação" abaixo do nó para adicionar mais ramificações de condição.

![20251123222540](https://static-docs.nocobase.com/20251123222540.png)

### Adicionar Ramificação

Após clicar em "Adicionar ramificação", a nova ramificação é anexada antes da ramificação "Caso Contrário".

![20251123222805](https://static-docs.nocobase.com/20251123222805.png)

### Excluir Ramificação

Quando existirem múltiplas ramificações de condição, clique no ícone da lixeira à direita de uma ramificação para excluí-la. Se restar apenas uma ramificação de condição, ela não poderá ser excluída.

![20251123223127](https://static-docs.nocobase.com/20251123223127.png)

:::info{title=Observação}
A exclusão de uma ramificação também excluirá todos os nós dentro dela; prossiga com cautela.

A ramificação "Caso Contrário" é uma ramificação integrada e não pode ser excluída.
:::

## Configuração do Nó

### Configuração da Condição

Clique no nome da condição na parte superior de uma ramificação para editar os detalhes específicos da condição:

![20251123223352](https://static-docs.nocobase.com/20251123223352.png)

#### Rótulo da Condição

Suporta rótulos personalizados. Uma vez preenchido, será exibido como o nome da condição no fluxograma. Se não for configurado (ou deixado em branco), o padrão será "Condição 1", "Condição 2", etc., em sequência.

![20251123224209](https://static-docs.nocobase.com/20251123224209.png)

#### Mecanismo de Cálculo

Atualmente, três mecanismos são suportados:

-   **Básico**: Usa comparações lógicas simples (por exemplo, igual a, contém) e combinações "E"/"OU" para determinar os resultados.
-   **Math.js**: Suporta cálculo de expressões usando a sintaxe [Math.js](https://mathjs.org/).
-   **Formula.js**: Suporta cálculo de expressões usando a sintaxe [Formula.js](https://formulajs.info/) (semelhante às fórmulas do Excel).

Todos os três modos suportam o uso de variáveis de contexto do fluxo de trabalho como parâmetros.

### Quando Nenhuma Condição For Atendida

No painel de configuração do nó, você pode definir a ação subsequente quando nenhuma condição for atendida:

![20251123224348](https://static-docs.nocobase.com/20251123224348.png)

*   **Finalizar fluxo de trabalho com falha (Padrão)**: Marca o status do fluxo de trabalho como falho e encerra o processo.
*   **Continuar a executar nós subsequentes**: Após a conclusão do nó atual, continua a executar os nós subsequentes no fluxo de trabalho.

:::info{title=Observação}
Independentemente do método de tratamento escolhido, quando nenhuma condição for atendida, o fluxo entrará primeiro na ramificação "Caso Contrário" para executar os nós dentro dela.
:::

## Histórico de Execução

No histórico de execução do fluxo de trabalho, o nó de Múltiplas Condições identifica o resultado de cada condição usando cores diferentes:

-   **Verde**: Condição atendida; entrou nesta ramificação.
-   **Vermelho**: Condição não atendida (ou erro de cálculo); esta ramificação foi ignorada.
-   **Azul**: Avaliação não executada (ignorada porque uma condição anterior já foi atendida).

![20251123225455](https://static-docs.nocobase.com/20251123225455.png)

Se um erro de configuração causar uma exceção de cálculo, além de ser exibido em vermelho, ao passar o mouse sobre o nome da condição, informações específicas do erro serão mostradas:

![20251123231014](https://static-docs.nocobase.com/20251123231014.png)

Quando ocorre uma exceção no cálculo da condição, o nó de Múltiplas Condições finalizará com o status de "Erro" e não continuará a executar os nós subsequentes.