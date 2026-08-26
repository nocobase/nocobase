---
title: "Crear un plugin de gestión de datos full-stack"
description: "Tutorial práctico: defina la colección en el servidor, presente los datos con TableBlockModel en el cliente y añada un campo y una acción personalizados, todo en un plugin completo full-stack."
keywords: "full-stack,TableBlockModel,defineCollection,ActionModel,ClickableFieldModel,ctx.viewer,NocoBase"
---

# Crear un plugin de gestión de datos full-stack

Los ejemplos anteriores eran o bien puramente de cliente (bloques, campos, acciones) o bien cliente + un endpoint sencillo (página de configuración). Este ejemplo presenta un escenario más completo: en el servidor se define una tabla y, en el cliente, se hereda de `TableBlockModel` para obtener una tabla completa, con campo personalizado y acción personalizada, formando un plugin de gestión de datos con CRUD.

Aquí se combinan los conceptos vistos antes (bloques, campos, acciones) en un único plugin completo.

:::tip Lectura previa

Se recomienda revisar antes los siguientes contenidos:

- [Crear el primer plugin](../../write-your-first-plugin): creación del plugin y estructura de directorios.
- [Plugin](../plugin): entrada del plugin y ciclo de vida de `load()`.
- [FlowEngine → Extensión de bloques](../flow-engine/block): BlockModel, CollectionBlockModel, TableBlockModel.
- [FlowEngine → Extensión de campos](../flow-engine/field): ClickableFieldModel, bindModelToInterface.
- [FlowEngine → Extensión de acciones](../flow-engine/action): ActionModel, ActionSceneEnum.
- [Internacionalización (i18n)](../component/i18n): archivos de traducción y `tExpr()`.
- [Visión general del desarrollo en servidor](../../server): bases del plugin de servidor.

:::

## Resultado final

Vamos a crear un plugin de "tareas pendientes" con las siguientes capacidades:

- En el servidor se define una tabla `todoItems` y se inyectan datos de ejemplo al instalar el plugin.
- En el cliente se hereda de `TableBlockModel` para obtener un bloque de tabla listo para usar (columnas, paginación, barra de acciones, etc.).
- Componente de campo personalizado: el campo `priority` se muestra con un Tag de color.
- Acción personalizada: botón "New todo" que abre un diálogo con un formulario para crear registros.

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_16.32.52.mp4" type="video/mp4">
</video>

Código fuente completo en [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource). Para ejecutarlo en local:

```bash
yarn pm enable @nocobase-example/plugin-custom-table-block-resource
```

A continuación se construye el plugin paso a paso.

## Paso 1: crear el esqueleto del plugin

Desde la raíz del repositorio:

```bash
yarn pm create @my-project/plugin-custom-table-block-resource
```

Para más detalles, consulte [Crear el primer plugin](../../write-your-first-plugin).

## Paso 2: definir la tabla (servidor)

Cree `src/server/collections/todoItems.ts`. NocoBase carga automáticamente las definiciones de Collection de este directorio:

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

A diferencia del ejemplo de la página de configuración, aquí no es necesario registrar manualmente un resource: NocoBase genera automáticamente las acciones CRUD estándar (`list`, `get`, `create`, `update`, `destroy`) para cada Collection.

## Paso 3: configurar permisos y datos de ejemplo (servidor)

Edite `src/server/plugin.ts`. En `load()` configure los permisos ACL y en `install()` inserte datos de ejemplo:

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginDataBlockServer extends Plugin {
  async load() {
    // Los usuarios autenticados pueden hacer CRUD sobre todoItems
    this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
  }

  async install() {
    // En la primera instalación del plugin, insertar registros de ejemplo
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

Puntos clave:

- **`acl.allow()`**: `['list', 'get', 'create', 'update', 'destroy']` abre los permisos completos de CRUD; `'loggedIn'` indica que basta con estar autenticado.
- **`install()`**: solo se ejecuta la primera vez que se instala el plugin; ideal para datos iniciales.
- **`this.db.getRepository()`**: devuelve el objeto de operaciones de datos a partir del nombre de la Collection.
- No es necesario `resourceManager.define()`: NocoBase genera las acciones CRUD automáticamente.

## Paso 4: crear el modelo del bloque (cliente)

Cree `src/client-v2/models/TodoBlockModel.tsx`. Heredar de `TableBlockModel` proporciona directamente toda la funcionalidad de un bloque de tabla (columnas, barra de acciones, paginación, ordenación, etc.); no es necesario implementar `renderComponent`.

![20260408164204](https://static-docs.nocobase.com/20260408164204.png)

:::tip Consejo

En el desarrollo real, si no necesita personalizar `TableBlockModel`, no es indispensable heredarlo y registrarlo: el usuario puede elegir directamente "Table" al añadir el bloque. En este tutorial se hace así para mostrar el flujo de definición y registro de un modelo de bloque, por eso se escribe `TodoBlockModel` heredando de `TableBlockModel`. `TableBlockModel` se ocupa de todo lo demás (columnas, barra de acciones, paginación, etc.).

:::

```tsx
// src/client-v2/models/TodoBlockModel.tsx
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  // Restringir el bloque exclusivamente a la Collection todoItems
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

Mediante `filterCollection` restringimos el bloque a la Collection `todoItems`: cuando el usuario añada el "Todo block", la lista de Collections solo mostrará `todoItems`, sin el resto de tablas no relacionadas.

![20260408170026](https://static-docs.nocobase.com/20260408170026.png)

## Paso 5: crear el componente de campo personalizado (cliente)

Cree `src/client-v2/models/PriorityFieldModel.tsx`. Mostrar el campo `priority` con un Tag de color es mucho más intuitivo que mostrarlo como texto plano:

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

// Enlazar a la interface input (texto de una sola línea)
DisplayItemModel.bindModelToInterface('PriorityFieldModel', ['input']);
```

Tras el registro, en la configuración de la columna `priority` de la tabla, el desplegable "Componente de campo" permitirá cambiar a "Priority tag".

## Paso 6: crear el botón de acción personalizado (cliente)

Cree `src/client-v2/models/NewTodoActionModel.tsx`. Al pulsar "New todo" se abre un diálogo con `ctx.viewer.dialog()`; tras enviar el formulario se crea el registro:

![20260408163810](https://static-docs.nocobase.com/20260408163810.png)

```tsx
// src/client-v2/models/NewTodoActionModel.tsx
import React from 'react';
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource, observable, observer } from '@nocobase/flow-engine';
import { Button, Form, Input, Select, Space, Switch } from 'antd';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

// Gestionar el estado de carga con observable, en lugar de useState
const formState = observable({
  loading: false,
});

// Componente de formulario dentro del diálogo, envuelto en observer para reaccionar a los cambios de observable
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
  on: 'click', // Escuchar el evento de clic del botón
  steps: {
    openForm: {
      async handler(ctx) {
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        // Abrir un diálogo con ctx.viewer.dialog
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

Puntos clave:

- **`ActionSceneEnum.collection`**: el botón aparece en la barra de acciones superior del bloque.
- **`on: 'click'`**: con `registerFlow` se escucha el evento `click` del botón.
- **`ctx.viewer.dialog()`**: capacidad de diálogo integrada en NocoBase. `content` recibe una función cuyo parámetro `view` permite cerrar el diálogo con `view.close()`.
- **`resource.create(values)`**: invoca la acción `create` de la Collection; tras la creación, la tabla se refresca automáticamente.
- **`observable` + `observer`**: gestión reactiva de estado provista por flow-engine; el componente reacciona automáticamente al cambio de `formState.loading`.

## Paso 7: añadir los archivos de traducción

Edite los archivos en `src/locale/`:

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

:::warning Atención

La primera vez que añada un archivo de idioma debe reiniciar la aplicación para que surta efecto.

:::

Para más detalles sobre los archivos de traducción y `tExpr()`, consulte [Internacionalización (i18n)](../component/i18n).

## Paso 8: registrar en el plugin (cliente)

Edite `src/client-v2/plugin.tsx`. Hay dos cosas que hacer: registrar los modelos y registrar `todoItems` en la fuente de datos del cliente.

:::warning Atención

Registrar manualmente una Collection con `addCollection` desde el código del plugin es una **práctica poco habitual**; aquí solo se hace para demostrar el flujo full-stack completo. En proyectos reales, las Collections suelen crearse y configurarse desde la interfaz de NocoBase, o gestionarse vía API / MCP, sin necesidad de registrarlas explícitamente desde el cliente del plugin.

:::

Las Collections definidas con `defineCollection` son tablas internas del servidor y, por defecto, no aparecen en la lista de Collections cuando se añade un bloque. Tras registrarlas con `addCollection`, el usuario podrá seleccionar `todoItems` al añadir un bloque.

![20260408164023](https://static-docs.nocobase.com/20260408164023.png)

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

const todoItemsCollection = {
  name: 'todoItems',
  title: 'Todo Items',
  // filterTargetKey debe configurarse; sin él, la collection no aparece en la lista del bloque
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
    // Registrar los modelos de bloque, campo y acción
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

Puntos clave:

- **`registerModelLoaders`**: registro con carga bajo demanda de los tres modelos: bloque, campo y acción.
- **`this.app.eventBus`**: bus de eventos a nivel de aplicación, sirve para escuchar eventos del ciclo de vida.
- **Evento `dataSource:loaded`**: se dispara al terminar de cargarse la fuente de datos. Es obligatorio llamar a `addCollection` dentro del callback de este evento, porque `ensureLoaded()` se ejecuta después de `load()` y limpia todas las Collections antes de volver a fijarlas; llamarlo directamente en `load()` haría que la operación se sobrescribiera.
- **`addCollection()`**: registra la Collection en la fuente de datos del cliente. Los campos deben llevar `interface` y `uiSchema` para que NocoBase sepa cómo renderizarlos.
- **`filterTargetKey: 'id'`**: obligatorio; especifica el campo que identifica unívocamente el registro (normalmente la clave primaria). Si no se configura, la Collection no aparece en la lista del bloque.
- En el servidor, `defineCollection` se encarga de crear la tabla física y el mapeo ORM; en el cliente, `addCollection` permite a la UI saber que esa tabla existe; la combinación de ambos completa la integración full-stack.

## Paso 9: activar el plugin

```bash
yarn pm enable @my-project/plugin-custom-table-block-resource
```

Una vez activado:

1. Cree una página, haga clic en "Añadir bloque", seleccione "Todo block" y enlácelo a la Collection `todoItems`.
2. La tabla cargará los datos automáticamente y mostrará columnas, paginación, etc.
3. Desde "Configurar acciones", añada el botón "New todo": al pulsarlo se abrirá un diálogo con el formulario para crear registros.
4. En la columna `priority`, dentro de "Componente de campo", cambie a "Priority tag" para que el valor se muestre con un Tag de color.

<!-- Aquí haría falta una captura de las capacidades una vez activado el plugin -->

## Código fuente completo

- [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource): plugin de gestión de datos full-stack completo.

## Resumen

Capacidades utilizadas en este ejemplo:

| Capacidad             | Uso                                                | Documentación                                            |
| --------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| Definición de Collection | `defineCollection()`                            | [Servidor → Collections](../../server/collections)       |
| Control de permisos    | `acl.allow()`                                     | [Servidor → ACL](../../server/acl)                       |
| Datos iniciales       | `install()` + `repo.createMany()`                  | [Servidor → Plugin](../../server/plugin)                 |
| Bloque de tabla        | `TableBlockModel`                                 | [FlowEngine → Extensión de bloques](../flow-engine/block) |
| Registrar Collection en el cliente | `addCollection()` + `eventBus` + `filterTargetKey` | [Plugin](../plugin)                                      |
| Campo personalizado    | `ClickableFieldModel` + `bindModelToInterface`     | [FlowEngine → Extensión de campos](../flow-engine/field) |
| Acción personalizada   | `ActionModel` + `registerFlow({ on: 'click' })`    | [FlowEngine → Extensión de acciones](../flow-engine/action) |
| Diálogo                | `ctx.viewer.dialog()`                              | [Context → Capacidades comunes](../ctx/common-capabilities) |
| Estado reactivo        | `observable` + `observer`                          | [Desarrollo de Component](../component/index.md)         |
| Registro de modelos    | `this.flowEngine.registerModelLoaders()`           | [Plugin](../plugin)                                      |
| Traducción diferida    | `tExpr()`                                          | [Internacionalización (i18n)](../component/i18n)         |

## Enlaces relacionados

- [Crear el primer plugin](../../write-your-first-plugin): crear el esqueleto desde cero.
- [Visión general de FlowEngine](../flow-engine/index.md): uso básico de FlowModel y `registerFlow`.
- [FlowEngine → Extensión de bloques](../flow-engine/block): BlockModel, TableBlockModel.
- [FlowEngine → Extensión de campos](../flow-engine/field): ClickableFieldModel, bindModelToInterface.
- [FlowEngine → Extensión de acciones](../flow-engine/action): ActionModel, ActionSceneEnum.
- [Crear un bloque de presentación personalizado](./custom-block): ejemplo básico de BlockModel.
- [Crear un componente de campo personalizado](./custom-field): ejemplo básico de FieldModel.
- [Crear un botón de acción personalizado](./custom-action): ejemplo básico de ActionModel.
- [Visión general del desarrollo en servidor](../../server): bases del plugin de servidor.
- [Servidor → Collections](../../server/collections): `defineCollection` y `addCollection`.
- [Tabla rápida de Resource API](../../../api/flow-engine/resource.md): firmas completas de `MultiRecordResource` / `SingleRecordResource`.
- [Plugin](../plugin): entrada del plugin y ciclo de vida.
- [Internacionalización (i18n)](../component/i18n): archivos de traducción y `tExpr`.
- [Servidor → ACL](../../server/acl): configuración de permisos.
- [Servidor → Plugin](../../server/plugin): ciclo de vida del plugin de servidor.
- [Context → Capacidades comunes](../ctx/common-capabilities): `ctx.viewer`, `ctx.message`, etc.
- [Desarrollo de Component](../component/index.md): uso de Form de Antd, etc.
- [Documentación completa de FlowEngine](../../../flow-engine/index.md): referencia completa.
