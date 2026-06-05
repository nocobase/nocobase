:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Excluir dados

Usado para excluir dados de uma **coleção** que atenda a certas condições.

O uso básico do nó de exclusão é semelhante ao nó de atualização, com a diferença de que o nó de exclusão não exige atribuição de campos. Você só precisa selecionar a **coleção** e as condições de filtro. O resultado do nó de exclusão retorna o número de linhas excluídas com sucesso, que pode ser visualizado apenas no histórico de execução e não pode ser usado como uma variável em nós subsequentes.

:::info{title=Atenção}
Atualmente, o nó de exclusão não suporta a exclusão linha por linha; ele realiza exclusões em lote. Portanto, ele não irá disparar outros eventos para cada exclusão de dado individual.
:::

## Criar nó

Na interface de configuração do **fluxo de trabalho**, clique no botão de adição ("+") no fluxo para adicionar um nó de "Excluir dados":

![Criar nó de exclusão de dados](https://static-docs.nocobase.com/e1d6b8728251fcdbed6c7f50e5570da2.png)

## Configuração do nó

![Nó de exclusão_Configuração do nó](https://static-docs.nocobase.com/580600c2b13ef4e01dfa48b23539648e.png)

### Coleção

Selecione a **coleção** da qual você deseja excluir dados.

### Condições de filtro

Semelhante às condições de filtro para uma consulta de **coleção** regular, você pode usar as variáveis de contexto do **fluxo de trabalho**.

## Exemplo

Por exemplo, para limpar periodicamente dados de pedidos históricos cancelados e inválidos, você pode usar o nó de exclusão:

![Nó de exclusão_Exemplo_Configuração do nó](https://static-docs.nocobase.com/b94b75077a17252f8523c3f13ce5f320.png)

O **fluxo de trabalho** será acionado periodicamente e executará a exclusão de todos os dados de pedidos históricos cancelados e inválidos.