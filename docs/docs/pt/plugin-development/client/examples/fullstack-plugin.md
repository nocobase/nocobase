---
title: "Construir um plugin de gestão de dados com integração front-back"
description: "Hands-on de plugins NocoBase: definir uma data table no Server + exibir os dados no Client com TableBlockModel + campos e ações personalizados, um plugin completo com integração front-back."
keywords: "integração front-back,TableBlockModel,defineCollection,ActionModel,ClickableFieldModel,ctx.viewer,NocoBase"
---

# Construir um plugin de gestão de dados com integração front-back

Os exemplos anteriores eram puramente client-side (bloco, campo, ação) ou client + uma API simples (página de configurações). Este exemplo mostra um cenário mais completo — o servidor define a data table, o cliente herda de `TableBlockModel` para ganhar capacidades completas de tabela, mais um componente de campo personalizado e um botão de ação personalizado, formando um plugin de gestão de dados com CRUD.

Este exemplo costura o que aprendemos sobre bloco, campo e ação, mostrando o fluxo completo de desenvolvimento de um plugin.

:::tip Dica de leitura prévia

É recomendável conhecer os seguintes tópicos antes:

- [Escreva seu primeiro plugin](../../write-your-first-plugin) — criação do plugin e estrutura de diretórios
- [Plugin](../plugin) — entrada do plugin e ciclo de vida `load()`
- [FlowEngine → Extensão de blocos](../flow-engine/block) — BlockModel, CollectionBlockModel, TableBlockModel
- [FlowEngine → Extensão de campos](../flow-engine/field) — ClickableFieldModel, bindModelToInterface
- [FlowEngine → Extensão de ações](../flow-engine/action) — ActionModel, ActionSceneEnum
- [i18n internacionalização](../component/i18n) — escrita de arquivos de tradução e uso de `tExpr()`
- [Visão geral do desenvolvimento server-side](../../server) — fundamentos de plugins do servidor

:::

## Resultado final

Vamos construir um plugin de gestão de "Tarefas (To-Do)" com as seguintes capacidades:

- O servidor define uma data table `todoItems`; ao instalar o plugin, dados de exemplo são automaticamente inseridos
- O cliente herda de `TableBlockModel`, fornecendo um bloco de tabela pronto para uso (colunas, paginação, barra de ações etc.)
- Componente de campo personalizado — renderiza o campo priority como uma Tag colorida
- Botão de ação personalizado — botão "Nova tarefa" que, ao clicar, abre uma modal para preencher o formulário e criar o registro

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_16.32.52.mp4" type="video/mp4">
</video>

O código-fonte completo está em [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource). Se quiser executar localmente para ver o resultado:

```bash
yarn pm enable @nocobase-example/plugin-custom-table-block-resource
```

A seguir, montamos esse plugin do zero, passo a passo.

## Passo 1: criar o esqueleto do plugin

Na raiz do repositório, execute:

```bash
yarn pm create @my-project/plugin-custom-table-block-resource
```

Para mais detalhes, veja [Escreva seu primeiro plugin](../../write-your-first-plugin).

## Passo 2: definir a data table (server)

Crie `src/server/collections/todoItems.ts`. O NocoBase carrega automaticamente as definições de collection desse diretório:

```ts
// src/server/collections/todoItems.ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'todoItems',
  title: 'Todo Items',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    {
      name: 'completed',
      type: 'boolean',
      title: 'Completed',
      defaultValue: false,
    },
    {
      name: 'priority',
      type: 'string',
      title: 'Priority',
      defaultValue: 'medium',
    },
  ],
});
```

Diferente do exemplo de página de configurações, aqui não é preciso registrar resource manualmente — o NocoBase gera automaticamente as APIs CRUD padrão para cada collection (`list`, `get`, `create`, `update`, `destroy`).

## Passo 3: configurar permissões e dados de exemplo (server)

Edite `src/server/plugin.ts`. Em `load()`, configure as permissões ACL; em `install()`, insira os dados de exemplo:

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginDataBlockServer extends Plugin {
  async load() {
    // 登录用户可以对 todoItems 进行增删改查
    this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
  }

  async install() {
    // 插件首次安装时，插入几条示例数据
    const repo = this.db.getRepository('todoItems');
    const count = await repo.count();
    if (count === 0) {
      await repo.createMany({
        records: [
          { title: 'Learn NocoBase plugin development', completed: true, priority: 'high' },
          { title: 'Build a custom block', completed: false, priority: 'high' },
          { title: 'Write documentation', completed: false, priority: 'medium' },
          { title: 'Add unit tests', completed: false, priority: 'low' },
        ],
      });
    }
  }
}

export default PluginDataBlockServer;
```

Pontos-chave:

- **`acl.allow()`** — `['list', 'get', 'create', 'update', 'destroy']` libera o CRUD completo; `'loggedIn'` indica que usuários logados podem acessar
- **`install()`** — só executa na primeira instalação do plugin; ideal para inserir dados iniciais
- **`this.db.getRepository()`** — obtém o objeto de operação de dados pelo nome da collection
- Não é necessário `resourceManager.define()` — o NocoBase gera automaticamente as APIs CRUD para a collection

## Passo 4: criar o modelo do bloco (client)

Crie `src/client-v2/models/TodoBlockModel.tsx`. Herdando de `TableBlockModel`, você ganha diretamente as capacidades completas do bloco de tabela — colunas de campo, barra de ações, paginação, ordenação etc., sem precisar escrever `renderComponent`.

![20260408164204](https://static-docs.nocobase.com/20260408164204.png)

:::tip Dica

Em desenvolvimento real de plugins, se você não precisa personalizar o `TableBlockModel`, na verdade não é preciso herdá-lo nem registrá-lo — basta que o usuário escolha "Tabela" ao adicionar o bloco. Aqui o `TodoBlockModel` é escrito apenas para demonstrar a definição e o registro de um modelo de bloco. O `TableBlockModel` cuida de tudo o mais (colunas de campo, barra de ações, paginação etc.).

:::

```tsx
// src/client-v2/models/TodoBlockModel.tsx
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  // 限制只对 todoItems 数据表可用
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

Com `filterCollection`, restringimos esse bloco à data table `todoItems` — ao adicionar "Todo block", a lista de seleção de data table mostrará apenas `todoItems`, sem outras tabelas não relacionadas.

![20260408170026](https://static-docs.nocobase.com/20260408170026.png)

## Passo 5: criar o componente de campo personalizado (client)

Crie `src/client-v2/models/PriorityFieldModel.tsx`. Renderizar o campo priority com Tag colorida fica muito mais visual que texto puro:

![20260408163645](https://static-docs.nocobase.com/20260408163645.png)

```tsx
// src/client-v2/models/PriorityFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { Tag } from 'antd';
import { tExpr } from '../locale';

const priorityColors: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'green',
};

export class PriorityFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    if (!value) return <span>-</span>;
    return <Tag color={priorityColors[value] || 'default'}>{value}</Tag>;
  }
}

PriorityFieldModel.define({
  label: tExpr('Priority tag'),
});

// 绑定到 input（单行文本）类型的字段接口
DisplayItemModel.bindModelToInterface('PriorityFieldModel', ['input']);
```

Após registrar, na configuração da coluna priority, o menu suspenso "Componente de campo" terá a opção "Priority tag".

## Passo 6: criar o botão de ação personalizado (client)

Crie `src/client-v2/models/NewTodoActionModel.tsx`. Ao clicar em "Nova tarefa", usamos `ctx.viewer.dialog()` para abrir uma modal e criar um registro após preencher o formulário:

![20260408163810](https://static-docs.nocobase.com/20260408163810.png)

```tsx
// src/client-v2/models/NewTodoActionModel.tsx
import React from 'react';
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource, observable, observer } from '@nocobase/flow-engine';
import { Button, Form, Input, Select, Space, Switch } from 'antd';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

// 用 observable 管理加载状态，替代 useState
const formState = observable({
  loading: false,
});

// 弹窗内的表单组件，用 observer 包裹以响应 observable 变化
const NewTodoForm = observer(function NewTodoForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    const values = await form.validateFields();
    formState.loading = true;
    try {
      await onSubmit(values);
    } finally {
      formState.loading = false;
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ priority: 'medium', completed: false }}>
      <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter title' }]}>
        <Input placeholder="Enter todo title" />
      </Form.Item>
      <Form.Item label="Priority" name="priority">
        <Select
          options={[
            { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' },
            { label: 'Low', value: 'low' },
          ]}
        />
      </Form.Item>
      <Form.Item label="Completed" name="completed" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={formState.loading}>
            OK
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
});

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    type: 'primary',
    children: tExpr('New todo'),
  };
}

NewTodoActionModel.define({
  label: tExpr('New todo'),
});

NewTodoActionModel.registerFlow({
  key: 'newTodoFlow',
  title: tExpr('New todo'),
  on: 'click', // 监听按钮点击事件
  steps: {
    openForm: {
      async handler(ctx) {
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        // 使用 ctx.viewer.dialog 打开弹窗
        ctx.viewer.dialog({
          content: (view) => (
            <NewTodoForm
              onSubmit={async (values) => {
                await resource.create(values);
                ctx.message.success(ctx.t('Created successfully'));
                view.close();
              }}
              onCancel={() => view.close()}
            />
          ),
        });
      },
    },
  },
});
```

Pontos-chave:

- **`ActionSceneEnum.collection`** — o botão aparece na barra de ações no topo do bloco
- **`on: 'click'`** — escuta o evento `click` do botão via `registerFlow`
- **`ctx.viewer.dialog()`** — capacidade integrada de modal do NocoBase; `content` recebe uma função, e o parâmetro `view` permite chamar `view.close()` para fechar a modal
- **`resource.create(values)`** — chama a API create da data table para criar um registro; após a criação, a tabela é atualizada automaticamente
- **`observable` + `observer`** — usar o gerenciamento de estado reativo do flow-engine no lugar de `useState`; o componente reage automaticamente às mudanças em `formState.loading`

## Passo 7: adicionar arquivos multilíngues

Edite os arquivos de tradução em `src/locale/` do plugin:

```json
// src/locale/zh-CN.json
{
  "Todo block": "待办事项区块",
  "Priority tag": "优先级标签",
  "New todo": "新建待办",
  "Todo form": "待办表单",
  "Title": "标题",
  "Priority": "优先级",
  "Completed": "已完成",
  "Created successfully": "创建成功"
}
```

```json
// src/locale/en-US.json
{
  "Todo block": "Todo block",
  "Priority tag": "Priority tag",
  "New todo": "New todo",
  "Todo form": "Todo form",
  "Title": "Title",
  "Priority": "Priority",
  "Completed": "Completed",
  "Created successfully": "Created successfully"
}
```

:::warning Atenção

Adicionar um novo arquivo de idioma pela primeira vez requer reiniciar a aplicação para ter efeito.

:::

Para mais informações sobre escrita de arquivos de tradução e uso de `tExpr()`, veja [i18n internacionalização](../component/i18n).

## Passo 8: registrar no plugin (client)

Edite `src/client-v2/plugin.tsx`. Há duas coisas a fazer: registrar os modelos e registrar `todoItems` na fonte de dados do cliente.

:::warning Atenção

Registrar manualmente uma data table no código do plugin via `addCollection` é uma **prática rara**, usada aqui apenas para demonstrar o fluxo completo de integração front-back. Em projetos reais, as data tables normalmente são criadas e configuradas pelo usuário na interface do NocoBase, ou gerenciadas via API / MCP, sem necessidade de registro explícito no código do cliente do plugin.

:::

A tabela definida via `defineCollection` é uma tabela interna do servidor; por padrão, não aparece na lista de seleção de data tables do bloco. Após registrá-la manualmente com `addCollection`, o usuário poderá selecionar `todoItems` ao adicionar o bloco.

![20260408164023](https://static-docs.nocobase.com/20260408164023.png)

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

const todoItemsCollection = {
  name: 'todoItems',
  title: 'Todo Items',
  // filterTargetKey 必须设置，否则 collection 不会出现在区块的数据表选择列表中
  filterTargetKey: 'id',
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
      interface: 'id',
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Title', 'x-component': 'Input' },
    },
    {
      type: 'boolean',
      name: 'completed',
      interface: 'checkbox',
      uiSchema: { type: 'boolean', title: 'Completed', 'x-component': 'Checkbox' },
    },
    {
      type: 'string',
      name: 'priority',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Priority', 'x-component': 'Input' },
    },
  ],
};

export class PluginCustomTableBlockResourceClientV2 extends Plugin {
  async load() {
    // 注册区块、字段、操作模型
    this.flowEngine.registerModelLoaders({
      TodoBlockModel: {
        loader: () => import('./models/TodoBlockModel'),
      },
      PriorityFieldModel: {
        loader: () => import('./models/PriorityFieldModel'),
      },
      NewTodoActionModel: {
        loader: () => import('./models/NewTodoActionModel'),
      },
    });

    // Register todoItems to the client-side data source.
    // Must listen to 'dataSource:loaded' event because ensureLoaded() runs after load(),
    // and it calls setCollections() which clears all collections before re-setting from server.
    // Re-register in the event callback to ensure addCollection survives reload.
    const addTodoCollection = () => {
      const mainDS = this.flowEngine.dataSourceManager.getDataSource('main');
      if (mainDS && !mainDS.getCollection('todoItems')) {
        mainDS.addCollection(todoItemsCollection);
      }
    };

    this.app.eventBus.addEventListener('dataSource:loaded', (event: Event) => {
      if ((event as CustomEvent).detail?.dataSourceKey === 'main') {
        addTodoCollection();
      }
    });
  }
}

export default PluginCustomTableBlockResourceClientV2;
```

Pontos-chave:

- **`registerModelLoaders`** — carregamento sob demanda registrando os três modelos: bloco, campo e ação
- **`this.app.eventBus`** — barramento de eventos da aplicação, usado para escutar eventos do ciclo de vida
- **Evento `dataSource:loaded`** — disparado após o carregamento da fonte de dados. É preciso chamar `addCollection` no callback desse evento, porque `ensureLoaded()` é executado após `load()` e chama `setCollections()`, que limpa todas as collections antes de reconfigurá-las a partir do servidor — chamar `addCollection` diretamente em `load()` faria com que ele fosse sobrescrito
- **`addCollection()`** — registra a collection na fonte de dados do cliente. Os campos precisam ter as propriedades `interface` e `uiSchema` para que o NocoBase saiba como renderizá-los
- **`filterTargetKey: 'id'`** — obrigatório, especifica o campo usado para identificar de forma única o registro (geralmente a chave primária). Sem isso, a collection não aparece na lista de seleção de data tables do bloco
- O `defineCollection` no servidor é responsável por criar a tabela física e o mapeamento ORM; o `addCollection` no cliente é responsável por informar à UI a existência dessa tabela — os dois lados precisam funcionar em conjunto para a integração front-back

## Passo 9: ativar o plugin

```bash
yarn pm enable @my-project/plugin-custom-table-block-resource
```

Após ativar:

1. Crie uma nova página, clique em "Adicionar bloco", selecione "Todo block" e vincule à data table `todoItems`
2. A tabela carrega os dados automaticamente, exibindo as colunas de campo, paginação etc.
3. Em "Configurar ações", adicione o botão "New todo"; ao clicar, abre uma modal para preencher o formulário e criar registros
4. Na configuração da coluna priority, em "Componente de campo", troque para "Priority tag" — priority será exibido como Tag colorida

<!-- 需要一张启用后完整功能的截图 -->

## Código-fonte completo

- [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource) — exemplo completo de plugin de gestão de dados com integração front-back

## Resumo

Capacidades usadas neste exemplo:

| Capacidade           | Uso                                              | Documentação                                            |
| -------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Definir data table   | `defineCollection()`                             | [Server → Collections](../../server/collections)        |
| Controle de permissões | `acl.allow()`                                  | [Server → Controle de permissões ACL](../../server/acl) |
| Dados iniciais       | `install()` + `repo.createMany()`                | [Server → Plugin](../../server/plugin)                  |
| Bloco de tabela      | `TableBlockModel`                                | [FlowEngine → Extensão de blocos](../flow-engine/block) |
| Registrar data table no cliente | `addCollection()` + `eventBus` + `filterTargetKey` | [Plugin](../plugin)                          |
| Campo personalizado  | `ClickableFieldModel` + `bindModelToInterface`   | [FlowEngine → Extensão de campos](../flow-engine/field) |
| Ação personalizada   | `ActionModel` + `registerFlow({ on: 'click' })`  | [FlowEngine → Extensão de ações](../flow-engine/action) |
| Modal                | `ctx.viewer.dialog()`                            | [Context → Capacidades comuns](../ctx/common-capabilities) |
| Estado reativo       | `observable` + `observer`                        | [Desenvolvimento de Component](../component/index.md)   |
| Registro de modelo   | `this.flowEngine.registerModelLoaders()`         | [Plugin](../plugin)                                     |
| Tradução adiada      | `tExpr()`                                        | [i18n internacionalização](../component/i18n)           |

## Links relacionados

- [Escreva seu primeiro plugin](../../write-your-first-plugin) — criar o esqueleto do plugin do zero
- [Visão geral do FlowEngine](../flow-engine/index.md) — uso básico do FlowModel e registerFlow
- [FlowEngine → Extensão de blocos](../flow-engine/block) — BlockModel, TableBlockModel
- [FlowEngine → Extensão de campos](../flow-engine/field) — ClickableFieldModel, bindModelToInterface
- [FlowEngine → Extensão de ações](../flow-engine/action) — ActionModel, ActionSceneEnum
- [Construir um bloco de exibição personalizado](./custom-block) — exemplo básico de BlockModel
- [Construir um componente de campo personalizado](./custom-field) — exemplo básico de FieldModel
- [Construir um botão de ação personalizado](./custom-action) — exemplo básico de ActionModel
- [Visão geral do desenvolvimento server-side](../../server) — fundamentos de plugins do servidor
- [Server → Collections](../../server/collections) — defineCollection e addCollection
- [Resumo da Resource API](../../../api/flow-engine/resource.md) — assinaturas completas dos métodos de MultiRecordResource / SingleRecordResource
- [Plugin](../plugin) — entrada do plugin e ciclo de vida load()
- [i18n internacionalização](../component/i18n) — escrita de arquivos de tradução e uso de tExpr
- [Server → Controle de permissões ACL](../../server/acl) — configuração de permissões
- [Server → Plugin](../../server/plugin) — ciclo de vida do plugin no servidor
- [Context → Capacidades comuns](../ctx/common-capabilities) — ctx.viewer, ctx.message etc.
- [Desenvolvimento de Component](../component/index.md) — uso de Antd Form e outros componentes
- [Documentação completa do FlowEngine](../../../flow-engine/index.md) — referência completa de FlowModel, Flow e Context
