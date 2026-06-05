:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Coleções

No desenvolvimento de **plugins** NocoBase, a **coleção (tabela de dados)** é um dos conceitos mais importantes. Você pode adicionar ou modificar estruturas de tabelas de dados em **plugins** definindo ou estendendo **coleções**. Diferente das tabelas de dados criadas pela interface de gerenciamento de **fontes de dados**, as **coleções** definidas via código são geralmente tabelas de metadados de nível de sistema e não aparecerão na lista de gerenciamento de **fontes de dados**.

## Definindo Coleções

Seguindo a estrutura de diretórios convencional, os arquivos de **coleção** devem ser colocados no diretório `./src/server/collections`. Use `defineCollection()` para criar novas tabelas e `extendCollection()` para estender tabelas existentes.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Exemplo de Artigos',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Título', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Conteúdo' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Autor' },
    },
  ],
});
```

No exemplo acima:

- `name`: Nome da tabela (uma tabela com o mesmo nome será gerada automaticamente no banco de dados).
- `title`: Nome de exibição da tabela na interface.
- `fields`: Coleção de campos, onde cada campo contém atributos como `type`, `name`, etc.

Quando você precisar adicionar campos ou modificar configurações para **coleções** de outros **plugins**, você pode usar `extendCollection()`:

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

Após ativar o **plugin**, o sistema adicionará automaticamente o campo `isPublished` à tabela `articles` existente.

:::tip
O diretório convencional será carregado antes que todos os métodos `load()` dos **plugins** sejam executados, evitando assim problemas de dependência causados por algumas tabelas de dados não carregadas.
:::

## Sincronizando a Estrutura do Banco de Dados

Quando um **plugin** é ativado pela primeira vez, o sistema sincroniza automaticamente as configurações da **coleção** com a estrutura do banco de dados. Se o **plugin** já estiver instalado e em execução, após adicionar ou modificar **coleções**, você precisará executar manualmente o comando de atualização:

```bash
yarn nocobase upgrade
```

Se ocorrerem exceções ou dados inconsistentes durante a sincronização, você pode reconstruir a estrutura da tabela reinstalando o aplicativo:

```bash
yarn nocobase install -f
```

## Geração Automática de Recursos (Resource)

Após definir uma **coleção**, o sistema gerará automaticamente um Recurso (Resource) correspondente, no qual você pode executar operações CRUD diretamente via API. Veja [Gerenciador de Recursos](./resource-manager.md).