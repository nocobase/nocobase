:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Adicionar Dados

Usado para adicionar um novo registro a uma **coleção**.

Os valores dos campos para o novo registro podem usar variáveis do contexto do **fluxo de trabalho**. Para atribuir valores a campos de relacionamento, você pode referenciar diretamente as variáveis de dados correspondentes no contexto, que podem ser um objeto ou o valor de uma chave estrangeira. Se você não usar variáveis, precisará inserir manualmente os valores das chaves estrangeiras. Para múltiplos valores de chave estrangeira em um relacionamento de muitos para muitos, eles devem ser separados por vírgulas.

## Criar Nó

Na interface de configuração do **fluxo de trabalho**, clique no botão de adição ("+") no fluxo para adicionar o nó "Adicionar Dados":

![Add 'Create Record' node](https://static-docs.nocobase.com/386c8c01c89b1eeab848510e77f4841a.png)

## Configuração do Nó

![Create Record Node_Example_Node Configuration](https://static-docs.nocobase.com/5f7b97a51b64a1741cf82a4d4455b610.png)

### Coleção

Selecione a **coleção** à qual você deseja adicionar um novo registro.

### Valores dos Campos

Atribua valores aos campos da **coleção**. Você pode usar variáveis do contexto do **fluxo de trabalho** ou inserir valores estáticos manualmente.

:::info{title="Observação"}
Os dados criados pelo nó "Adicionar Dados" em um **fluxo de trabalho** não lidam automaticamente com dados de usuário como "Criado por" e "Última modificação por". Você precisa configurar os valores para esses campos conforme necessário.
:::

### Pré-carregar Dados de Relacionamento

Se os campos do novo registro incluírem campos de relacionamento e você quiser usar os dados de relacionamento correspondentes em etapas subsequentes do **fluxo de trabalho**, você pode marcar os campos de relacionamento correspondentes na configuração de pré-carregamento. Dessa forma, após a criação do novo registro, os dados de relacionamento correspondentes serão automaticamente carregados e armazenados junto com os dados de resultado do nó.

## Exemplo

Por exemplo, quando um registro na **coleção** "Artigos" é criado ou atualizado, um registro de "Versões de Artigo" precisa ser criado automaticamente para registrar o histórico de alterações do artigo. Você pode usar o nó "Adicionar Dados" para conseguir isso:

![Create Record Node_Example_Workflow Configuration](https://static-docs.nocobase.com/dfd4820d49c145fa33183fc09c9161f.png)

![Create Record Node_Example_Node Configuration](https://static-docs.nocobase.com/1a0992e66170be12a068da6503298868.png)

Após habilitar o **fluxo de trabalho** com esta configuração, quando um registro na **coleção** "Artigos" for alterado, um registro de "Versões de Artigo" será criado automaticamente para registrar o histórico de alterações do artigo.