# Adding Simple Action

## Scenario

NocoBase has many `Configure actions` buttons for adding action buttons to the interface.

![img_v3_02b4_51f4918f-d344-43b2-b19e-48dca709467g](https://static-docs.nocobase.com/img_v3_02b4_51f4918f-d344-43b2-b19e-48dca709467g.jpg)

If the existing action buttons do not meet our requirements, we need to add sub-items to the existing `Configure actions` to create new action buttons.

Simple Action in the title refers to Actions that do not require a modal. You can refer to [Adding Action with Modal](/plugin-samples/schema-initializer/action-modal).

## Example

This example will create a button that opens the corresponding block's documentation when clicked, and add this button to the `Configure actions` in `Table`, `Details`, and `Form` blocks.

The complete example code for this document can be found in [plugin-samples](https://github.com/nocobase/plugin-samples/tree/main/packages/plugins/%40nocobase-sample/plugin-initializer-action-simple).

<video width="100%" controls="">
  <source src="https://static-docs.nocobase.com/20240522-185359.mp4" type="video/mp4" />
</video>

## Initialize Plugin

Following the [Write Your First Plugin](/plugin-development/write-your-first-plugin) documentation, if you don't have a project yet, you can create one first. If you already have one or have cloned the source code, you can skip this step.

```bash
yarn create nocobase-app my-nocobase-app -d postgres
cd my-nocobase-app
yarn install
yarn nocobase install
```

Then initialize a plugin and add it to the system:

```bash
yarn pm create @nocobase-sample/plugin-initializer-action-simple
yarn pm enable @nocobase-sample/plugin-initializer-action-simple
```

Then start the project:

```bash
yarn dev
```

After logging in, visit [http://localhost:13000/admin/pm/list/local/](http://localhost:13000/admin/pm/list/local/) to see that the plugin has been installed and enabled.

## Implementation

Before implementing this example, we need to understand some basic knowledge:

- [Action Component](https://client.docs.nocobase.com/components/action)
- [SchemaInitializer Tutorial](/development/client/ui-schema/initializer): Used to add various blocks, fields, operations, etc. to the interface
- [SchemaInitializer API](https://client.docs.nocobase.com/core/ui-schema/schema-initializer): Used to add various blocks, fields, operations, etc. to the interface
- [UI Schema](/development/client/ui-schema/what-is-ui-schema): Used to define the structure and style of the interface
- [Designable Designer](/development/client/ui-schema/designable): Used to modify Schema


```bash
.
├── client # Client plugin
│   ├── initializer # Initializer
│   ├── index.tsx # Client plugin entry
│   ├── locale.ts # Multi-language utility function
│   ├── constants.ts # Constants
│   ├── schema # Schema
│   └── settings # Schema Settings
├── locale # Multi-language files
│   ├── en-US.json # English
│   └── zh-CN.json # Chinese
├── index.ts # Server plugin entry
└── server # Server plugin
```

### 1. Define Name

First, we need to define the action name, which will be used in various places.

We create `packages/plugins/@nocobase-sample/plugin-initializer-action-simple/src/client/constants.ts`:

```ts
export const ActionName = 'Document';
export const ActionNameLowercase = ActionName.toLowerCase();
```

### 2. Define Schema

#### 2.1 Define Schema

NocoBase's dynamic pages are all rendered through Schema, so we need to define a Schema, which will be used later to add to the interface. Before implementing this section, we need to understand some basic knowledge:

- [Action Component](https://client.docs.nocobase.com/components/action)
- [UI Schema Protocol](/development/client/ui-schema/what-is-ui-schema): Detailed introduction to the structure of Schema and the role of each property

We create `packages/plugins/@nocobase-sample/plugin-initializer-action-simple/src/client/schema/index.ts` file with the following content:

```ts
import { useFieldSchema } from '@formily/react';
import { ISchema } from "@nocobase/client"
import { useT } from '../locale';
import { ActionName } from '../constants';

export function useDocumentActionProps() {
  const fieldSchema = useFieldSchema();
  const t = useT();
  return {
    title: t(ActionName),
    type: 'primary',
    onClick() {
      window.open(fieldSchema['x-doc-url'])
    }
  }
}

export const createDocumentActionSchema = (blockComponent: string): ISchema & { 'x-doc-url': string } => {
  return {
    type: 'void',
    'x-component': 'Action',
    'x-doc-url': `https://client.docs.nocobase.com/components/${blockComponent}`,
    'x-use-component-props': 'useDocumentActionProps',
  }
}
```

The `createDocumentActionSchema` component accepts a `blockComponent` parameter and returns a Schema, which is used to add a button to the interface that opens the corresponding block's documentation when clicked.

`createDocumentActionSchema`:
- `type`: Type, here it is `void`, indicating a pure UI component
- `x-component: 'Action'`: [Action component](https://client.docs.nocobase.com/components/action) used to generate a button
- `title: 'Document'`: Button title
- `x-doc-url`: Custom Schema property representing the documentation address
- `x-use-component-props: 'useDocumentActionProps'`: Dynamic properties, for more information refer to the [documentation](/development/client/ui-schema/what-is-ui-schema#x-component-props-和-x-use-component-props)

`useDocumentActionProps()`:
- [useFieldSchema()](https://client.docs.nocobase.com/core/ui-schema/designable#usefieldschema): Get the Schema of the current node
- `type: 'primary'`: Button type
- `onClick`: Click event to open the corresponding block's documentation

For more information about Schema, please refer to the [UI Schema](/development/client/ui-schema/what-is-ui-schema) documentation.

#### 2.2 Register scope

We need to register `useDocumentActionProps` to the system, so that `x-use-component-props` can find the corresponding scope.

```ts
import { useDocumentActionProps } from './schema';
import { Plugin } from '@nocobase/client';

export class PluginInitializerActionSimpleClient extends Plugin {
  async load() {
    this.app.addScopes({ useDocumentActionProps });
  }
}

export default PluginInitializerActionSimpleClient;
```

#### 2.3 Verify Block Schema

There are 2 ways to verify Schema:

- Temporary page verification: We can temporarily create a page and render the Schema to check if it meets the requirements
- Documentation example verification: You can start the documentation `yarn doc plugins/@nocobase-sample/plugin-initializer-action-modal`, and verify if it meets the requirements by writing documentation examples (TODO)

We use `temporary page verification` as an example. We create a new page and add one or more examples according to property parameters to check if they meet the requirements.

```tsx | pure
import { Plugin, SchemaComponent } from '@nocobase/client';
import { createDocumentActionSchema, useDocumentActionProps } from './schema';
import React from 'react';

export class PluginInitializerActionSimpleClient extends Plugin {
  async load() {
    this.app.addScopes({ useDocumentActionProps });
    this.app.router.add('admin.document-action-schema', {
      path: '/admin/document-action-schema',
      Component: () => {
        return <>
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <SchemaComponent schema={{ properties: { test1: createDocumentActionSchema('table-v2') } }} />
          </div>
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <SchemaComponent schema={{ properties: { test2: createDocumentActionSchema('details') } }} />
          </div>
        </>
      }
    })
  }
}

export default PluginInitializerActionSimpleClient;
```

Then we visit [http://localhost:13000/admin/document-action-schema](http://localhost:13000/admin/document-action-schema) to see the temporary page we added.

For detailed explanation of `SchemaComponent`, please refer to the [SchemaComponent](https://client.docs.nocobase.com/core/ui-schema/schema-component#schemacomponent-1) documentation.

<video controls width='100%' src="https://static-docs.nocobase.com/20240526171318_rec_.mp4"></video>

After verification, the test page needs to be deleted.

### 3. Define Schema Initializer Item

We create `packages/plugins/@nocobase-sample/plugin-initializer-action-simple/src/client/initializer/index.ts` file:

```tsx | pure
import { SchemaInitializerItemType, useSchemaInitializer } from "@nocobase/client"

import { createDocumentActionSchema } from '../schema';
import { ActionNameLowercase, ActionName } from "../constants";
import { useT } from "../locale";

export const createDocumentActionInitializerItem = (blockComponent: string): SchemaInitializerItemType => ({
  type: 'item',
  name: ActionNameLowercase,
  useComponentProps() {
    const { insert } = useSchemaInitializer();
    const t = useT();
    return {
      title: t(ActionName),
      onClick: () => {
        insert(createDocumentActionSchema(blockComponent));
      },
    };
  },
})
```

Because we need to generate different `DocumentAction` based on different `blockComponent`, we defined a `createDocumentActionInitializerItem` function to generate the corresponding Schema Initializer Item.

- `type`: Type, here it is `item`, indicating a text with a click event that can insert a new Schema when clicked
- `name`: Unique identifier used to distinguish different Schema Items and CRUD operations
- `useComponentProps`: Returns an object containing `title` and `onClick` properties, `title` is the displayed text, `onClick` is the callback function after clicking
- [useSchemaInitializer](https://client.docs.nocobase.com/core/ui-schema/schema-initializer#useschemainitializer): Used to get the `SchemaInitializerContext` context, which contains some operation methods

For more information about Schema Item definitions, please refer to the [Schema Initializer Item](https://client.docs.nocobase.com/core/ui-schema/schema-initializer#built-in-components-and-types) documentation.

### 4. Implement Schema Settings

#### 4.1 Define Schema Settings

Currently, after adding through `createDocumentActionInitializerItem()`, it cannot be deleted. We can use [Schema Settings](https://client.docs.nocobase.com/core/ui-schema/schema-settings) to set it.

We create `packages/plugins/@nocobase-sample/plugin-initializer-action-simple/src/client/settings/index.ts` file:

```ts
import { SchemaSettings } from "@nocobase/client";

import { ActionNameLowercase } from "../constants";

export const documentActionSettings = new SchemaSettings({
  name: `actionSettings:${ActionNameLowercase}`,
  items: [
    {
      name: 'remove',
      type: 'remove',
    }
  ]
});
```

#### 4.2 Register Schema Settings

```diff
import { Plugin } from '@nocobase/client';
import { useDocumentActionProps } from './schema';
+ import { documentActionSettings } from './settings';

export class PluginInitializerActionSimpleClient extends Plugin {
  async load() {
    this.app.addScopes({ useDocumentActionProps });
+   this.app.schemaSettingsManager.add(documentActionSettings);
  }
}

export default PluginInitializerActionSimpleClient;
```

#### 4.3 Use Schema Settings

We modify the `createDocumentActionSchema` in `packages/plugins/@nocobase-sample/plugin-initializer-action-simple/src/client/schema/index.ts` file:

```diff
+ import { documentActionSettings } from '../settings';

export const createDocumentActionSchema = (blockComponent: string): ISchema & { 'x-doc-url': string } => {
  return {
    type: 'void',
    'x-component': 'Action',
+   'x-settings': documentActionSettings.name,
    // ...
  }
}
```

### 5. Add to Page Configure actions

There are many `Configure actions` buttons in the system, but their **names are different**. We need to add it to the `Configure actions` in `Table`, `Details`, and `Form` blocks according to our needs.

First, let's find the corresponding name:

TODO

Then we modify `packages/plugins/@nocobase-sample/plugin-initializer-action-simple/src/client/index.tsx` file:

```diff
import { Plugin } from '@nocobase/client';
import { useDocumentActionProps } from './schema';
import { documentActionSettings } from './settings';
+ import { createDocumentActionInitializerItem } from './initializer';

export class PluginInitializerActionSimpleClient extends Plugin {
  async load() {
    this.app.addScopes({ useDocumentActionProps });
    this.app.schemaSettingsManager.add(documentActionSettings);
+   this.app.schemaInitializerManager.addItem('table:configureActions', 'document', createDocumentActionInitializerItem('table-v2'));
+   this.app.schemaInitializerManager.addItem('details:configureActions', 'document', createDocumentActionInitializerItem('details'));
+   this.app.schemaInitializerManager.addItem('createForm:configureActions', 'document', createDocumentActionInitializerItem('form-v2'));
  }
}

export default PluginInitializerActionSimpleClient;
```

<video width="100%" controls="">
  <source src="https://static-docs.nocobase.com/20240522-185359.mp4" type="video/mp4" />
</video>

### 6. Multi-language

:::warning
After multi-language files are changed, you need to restart the service for them to take effect
:::

##### 6.1 English

We edit `packages/plugins/@nocobase-sample/plugin-initializer-action-simple/src/locale/en-US.json` with the following content:

```json
{
  "Document": "Document"
}
```

##### 6.2 Chinese

We edit `packages/plugins/@nocobase-sample/plugin-initializer-action-simple/src/locale/zh-CN.json` with the following content:

```json
{
  "Document": "文档"
}
```

If you need more multi-language support, you can continue to add them.

We can add multiple languages through [http://localhost:13000/admin/settings/system-settings](http://localhost:13000/admin/settings/system-settings), and switch languages in the upper right corner.

![20240611113758](https://static-docs.nocobase.com/20240611113758.png)

## Packaging and Uploading to Production Environment

According to the [Build and Package Plugin](/plugin-development/write-your-first-plugin#build-and-package-plugin) documentation, we can package the plugin and upload it to the production environment.

If you cloned the source code, you need to execute a full build first to build the plugin's dependencies as well.

```bash
yarn build
```

If you used `create-nocobase-app` to create the project, you can directly execute:

```bash
yarn build @nocobase-sample/plugin-initializer-action-simple --tar
```

This way you can see the `storage/tar/@nocobase-sample/plugin-initializer-action-simple.tar.gz` file, and then install it by [uploading](/get-started/installation/plugins).
