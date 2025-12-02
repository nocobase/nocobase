:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Atualizar Dados

Usado para atualizar dados em uma **coleção** que atenda a condições específicas.

A parte de **coleção** e atribuição de campos é a mesma do nó de `Criar registro`. A principal diferença do nó de `Atualizar dados` é a adição de condições de filtro e a necessidade de selecionar um modo de atualização. Além disso, o resultado do nó de `Atualizar dados` retorna o número de linhas atualizadas com sucesso. Isso só pode ser visualizado no histórico de execução e não pode ser usado como uma variável em nós subsequentes.

## Criar Nó

Na interface de configuração do **fluxo de trabalho**, clique no botão de mais ("+") no fluxo para adicionar um nó de `Atualizar dados`:

![Atualizar Dados_Adicionar](https://static-docs.nocobase.com/9ff24d7bc173b3a71decc1f70ca9fb66.png)

## Configuração do Nó

![Nó de Atualização_Configuração do Nó](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

### Coleção

Selecione a **coleção** onde os dados precisam ser atualizados.

### Modo de Atualização

Existem dois modos de atualização:

*   **Atualização em massa**: Não aciona eventos da **coleção** para cada registro atualizado. Oferece melhor desempenho e é adequado para operações de atualização de grande volume.
*   **Atualização um a um**: Aciona eventos da **coleção** para cada registro atualizado. No entanto, pode causar problemas de desempenho com grandes volumes de dados e deve ser usado com cautela.

A escolha geralmente depende dos dados de destino para a atualização e se outros eventos do **fluxo de trabalho** precisam ser acionados. Se você estiver atualizando um único registro com base na chave primária, a `Atualização um a um` é recomendada. Se você estiver atualizando vários registros com base em condições, a `Atualização em massa` é recomendada.

### Condições de Filtro

Semelhante às condições de filtro em uma consulta de **coleção** normal, você pode usar variáveis de contexto do **fluxo de trabalho**.

### Valores de Campo

Semelhante à atribuição de campos no nó de `Criar registro`, você pode usar variáveis de contexto do **fluxo de trabalho** ou inserir valores estáticos manualmente.

Observação: Os dados atualizados pelo nó de `Atualizar dados` em um **fluxo de trabalho** não tratam automaticamente os dados de `Última modificação por`. Você precisa configurar o valor deste campo por conta própria, conforme necessário.

## Exemplo

Por exemplo, quando uma nova `Artigo` é criada, você precisa atualizar automaticamente o campo `Contagem de Artigos` na **coleção** `Categoria de Artigo`. Isso pode ser alcançado usando o nó de `Atualizar dados`:

![Nó de Atualização_Exemplo_Configuração do Nó](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

Após o **fluxo de trabalho** ser acionado, ele atualizará automaticamente o campo `Contagem de Artigos` da **coleção** `Categoria de Artigo` para a contagem atual de artigos + 1.