:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Consultar Dados

Use este nó para consultar e recuperar registros de dados de uma **coleção** que atendam a condições específicas.

Você pode configurar para consultar um único registro ou múltiplos registros. O resultado da consulta pode ser usado como uma variável em nós subsequentes. Ao consultar múltiplos registros, o resultado é um array. Se o resultado da consulta estiver vazio, você pode escolher se deseja continuar executando os nós seguintes.

## Criar Nó

Na interface de configuração do **fluxo de trabalho**, clique no botão de adição (“+”) no fluxo para adicionar um nó de “Consultar Dados”:

![Add Query Data Node](https://static-docs.nocobase.com/c1ef2b851b437806faf7a39c6ab9d33a.png)

## Configuração do Nó

![Query Node Configuration](https://static-docs.nocobase.com/20240520131324.png)

### Coleção

Selecione a **coleção** da qual você deseja consultar os dados.

### Tipo de Resultado

O tipo de resultado é dividido em “Registro Único” e “Múltiplos Registros”:

-   Registro Único: O resultado é um objeto, que corresponde apenas ao primeiro registro encontrado, ou `null`.
-   Múltiplos Registros: O resultado será um array contendo os registros que correspondem às condições. Se nenhum registro for encontrado, será um array vazio. Você pode processá-los um por um usando um nó de Loop.

### Condições de Filtro

Semelhante às condições de filtro em uma consulta de **coleção** comum, você pode usar as variáveis de contexto do **fluxo de trabalho**.

### Ordenação

Ao consultar um ou mais registros, você pode usar regras de ordenação para controlar o resultado desejado. Por exemplo, para consultar o registro mais recente, você pode ordenar pelo campo “Data de Criação” em ordem decrescente.

### Paginação

Quando o conjunto de resultados pode ser muito grande, você pode usar a paginação para controlar a quantidade de resultados da consulta. Por exemplo, para consultar os 10 registros mais recentes, você pode ordenar pelo campo “Data de Criação” em ordem decrescente e, em seguida, configurar a paginação para 1 página com 10 registros.

### Tratamento de Resultados Vazios

No modo de registro único, se nenhum dado atender às condições, o resultado da consulta será `null`. No modo de múltiplos registros, será um array vazio (`[]`). Você pode escolher se deseja marcar a opção “Sair do **fluxo de trabalho** quando o resultado da consulta estiver vazio”. Se marcada, e o resultado da consulta for vazio, os nós subsequentes não serão executados e o **fluxo de trabalho** será encerrado antecipadamente com status de falha.