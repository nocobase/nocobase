# Block Embedded Initializer - Configure Actions

## Scenario

If a newly created block is a complex data block, it may contain multiple dynamically added parts. The `Configure actions` initializer is mainly responsible for dynamically adding some buttons to implement various operations. For example, in the `Details` block, we can add `Edit`, `Print`, and other buttons through `Configure actions`.

![img_v3_02b4_9b80a4a0-6d9b-4e53-a544-f92c17d81d2g](https://static-docs.nocobase.com/img_v3_02b4_9b80a4a0-6d9b-4e53-a544-f92c17d81d2g.jpg)

## Example

This example will continue based on [Adding Data Block Data Block](/plugin-samples/schema-initializer/data-block) to implement an effect similar to the `Details` block, configuring buttons through `Configure actions`.

The complete example code for this document can be found in [plugin-samples](https://github.com/nocobase/plugin-samples/tree/main/packages/plugins/%40nocobase-sample/plugin-initializer-configure-actions).

<video width="100%" controls="">
  <source src="https://static-docs.nocobase.com/20240522-191602.mp4" type="video/mp4" />
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
yarn pm create @nocobase-sample/plugin-initializer-configure-actions
yarn pm enable @nocobase-sample/plugin-initializer-configure-actions
```

Then start the project:

```bash
yarn dev
```

After logging in, visit [http://localhost:13000/admin/pm/list/local/](http://localhost:13000/admin/pm/list/local/) to see that the plugin has been installed and enabled.

## Implementation

Before implementing this example, we need to understand some basic knowledge:

- [SchemaInitializer Tutorial](/development/client/ui-schema/initializer): Used to add various blocks, fields, operations, etc. to the interface
- [SchemaInitializer API](https://client.docs.nocobase.com/core/ui-schema/schema-initializer): Used to add various blocks, fields, operations, etc. to the interface
- [UI Schema](/development/client/ui-schema/what-is-ui-schema): Used to define the structure and style of the interface
- [Designable Designer](/development/client/ui-schema/designable): Used to modify Schema

### 1. Create Block

As mentioned earlier, this example will continue based on [Adding Data Block Data Block](/plugin-samples/schema-initializer/data-block), so we can copy the `packages/plugins/@nocobase-sample/plugin-initializer-block-data/src/client` directory to overwrite `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client`.

Then modify `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/index.tsx`:

```diff
import { Plugin } from '@nocobase/client';
- import { Info } from './component';
+ import { InfoV2 } from './component';

- export class PluginInitializerBlockDataClient extends Plugin {
+ export class PluginInitializerConfigureActionsClient extends Plugin {
  async load() {
-   this.app.addComponents({ Info })
+   this.app.addComponents({ InfoV2 })
    // ...
  }
}

- export default PluginInitializerBlockDataClient;
+ export default PluginInitializerConfigureActionsClient;
```

Then modify `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/constants.ts`:

```ts
export const BlockName = 'InfoV2';
export const BlockNameLowercase = 'info-v2';
```

### 2. Implement initializer

#### 2.1 Define initializer

We create `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/initializer/configureActions/configureActionsInitializer.ts` file:

```tsx | pure
import { SchemaInitializer } from "@nocobase/client";
import { BlockNameLowercase } from "../../constants";

export const configureActionsInitializer = new SchemaInitializer({
  name: `${BlockNameLowercase}:configureActions`,
  icon: 'SettingOutlined',
  title: 'Configure actions',
  style: {
    marginLeft: 8,
  },
  items: [

  ]
});
```

We defined a new `SchemaInitializer` through the above code, and the sub-items are temporarily empty.

- [SchemaInitializer](https://client.docs.nocobase.com/core/ui-schema/schema-initializer): Used to create a Schema Initializer instance
- `icon`: Icon, more icons can be found at Ant Design [Icons](https://ant.design/components/icon/)
- `title`: Button title
- [items](https://client.docs.nocobase.com/core/ui-schema/schema-initializer#built-in-components-and-types): Sub-items under the button

Then export it in `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/initializer/configureActions/index.ts`:

```tsx | pure
export * from './configureActionsInitializer';
```

And modify `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/initializer/index.tsx` to export `configureActions`:

```diff
import React from 'react';
import { SchemaInitializerItemType, useSchemaInitializer } from '@nocobase/client'
import { CodeOutlined } from '@ant-design/icons';

+ export * from './configureActions'
// ...
```

#### 2.2 Register initializer

Then modify `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/index.tsx` file to import and register this initializer:

```tsx | pure
// ...
import { infoInitializerItem, configureActionsInitializer } from './initializer';

export class PluginInitializerConfigureActionsClient extends Plugin {
  async load() {
    this.app.schemaInitializerManager.add(configureActionsInitializer)

    // ...
  }
}
```

#### 2.3 Use initializer

We modify `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/schema/index.ts` file to add a new `actions` child node:

```diff
// ...
+ import { configureActionsInitializer } from "../initializer";

function getInfoBlockSchema({ dataSource, collection }) {
  return {
    // ...
    properties: {
      info: {
        'x-component': BlockName,
        'x-use-component-props': 'useInfoProps',
+       properties: {
+         actions: {
+           type: 'void',
+           'x-component': 'ActionBar',
+           'x-component-props': {
+             layout: 'two-column',
+             style: { marginBottom: 20 }
+           },
+           'x-initializer': configureActionsInitializer.name,
+         }
+       }
      }
    }
  }
}
```

`configure actions` is generally used in combination with the [ActionBar](https://client.docs.nocobase.com/components/action#actionbar) component.


We added an `actions` field to the child nodes of `Info`:

- `type: 'void'`: Type is `void`, indicating this is a container
- `x-component: 'ActionBar'`: Use [ActionBar](https://client.docs.nocobase.com/components/action#actionbar) component to display buttons
- `x-initializer: configureActionsInitializer.name`: Use the Schema Initializer we just created
- `x-component-props.layout: 'two-column'`: Left and right layout, specific examples can be found at [ActionBar two-column](https://client.docs.nocobase.com/components/action#two-column)

#### 2.4 Block renders child nodes

We modify `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/component/Info.tsx` file to modify the `Info` component:

```diff
import React, { FC } from 'react';
import { withDynamicSchemaProps } from '@nocobase/client'

export interface InfoV2Props {
  collectionName: string;
  data?: any[];
  loading?: boolean;
+ children?: React.ReactNode;
}

export const InfoV2: FC<InfoV2Props> = withDynamicSchemaProps(({ children, collectionName, data }) => {
  return <div>
+   {children}
-   <div>collection: {collectionName}</div>
-   <div>data list: <pre>{JSON.stringify(data, null, 2)}</pre></div>
+   <div>data length: {data?.length}</div>
  </div>
}, { displayName: BlockName })
```

- `children`: The content of `properties` will be passed to the `children` of the `InfoV2` component, so we just need to render `children` directly.

![img_v3_02b4_4c6cb675-789e-48d5-99ce-072984dcfc9g](https://static-docs.nocobase.com/img_v3_02b4_4c6cb675-789e-48d5-99ce-072984dcfc9g.jpg)

### 3. Implement initializer items

#### 3.1 Reuse: `Custom request` Action

We continue to modify `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/initializer/configureActions/configureActionsInitializer.ts` file:

```diff
export const configureActions = new SchemaInitializer({
  name: 'info:configureActions',
  title: 'Configure actions',
  icon: 'SettingOutlined',
  items: [
+   {
+     name: 'customRequest',
+     title: '{{t("Custom request")}}',
+     Component: 'CustomRequestInitializer',
+   },
  ]
});
```

Because we directly reused the `CustomRequestInitializer` component for `Custom request`, more reusable Initializer Items can be found at *TODO*.

![img_v3_02b4_0d439087-cfe1-4681-bfab-4e4bc3e34cbg](https://static-docs.nocobase.com/img_v3_02b4_0d439087-cfe1-4681-bfab-4e4bc3e34cbg.jpg)

#### 3.2 Custom: `Custom Refresh` Action

In addition to reusing existing Initializer Items, we can also customize Actions. For detailed steps on customizing Actions, refer to [Adding Simple Action](/plugin-samples/schema-initializer/action-simple) and [Adding Action with Modal](/plugin-samples/schema-initializer/action-modal).

Here we implement a `Custom Refresh` Action.

#### 3.2.1 Define Name

We create `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/initializer/configureActions/items/customRefresh/constants.ts`:

```ts
export const ActionName = 'Custom Request';
export const ActionNameLowercase = 'customRequest';
```

#### 3.2.2 Define Schema

##### 3.2.2.1 Define Schema

We create `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/initializer/configureActions/items/customRefresh/schema.ts` file:

```ts
import { ActionProps, useDataBlockRequest, ISchema } from "@nocobase/client";
import { useT } from "../../../../locale";

export const useCustomRefreshActionProps = (): ActionProps => {
  const { runAsync } = useDataBlockRequest();
  const t = useT();
  return {
    type: 'primary',
    title: t('Custom Refresh'),
    async onClick() {
      await runAsync();
    },
  }
}

export const customRefreshActionSchema: ISchema = {
  type: 'void',
  'x-component': 'Action',
  'x-toolbar': 'ActionSchemaToolbar',
  'x-use-component-props': 'useCustomRefreshActionProps'
}
```

We defined `customRefreshActionSchema` and dynamic property `useCustomRefreshActionProps`.

`customRefreshActionSchema`:
  - `type: 'void'`: Type is `void`, indicating plain UI with no data
  - `x-component: 'Action'`: Use [Action](https://client.docs.nocobase.com/components/action) component to display button
  - `title: 'Custom Refresh'`: Button title
  - `x-use-component-props: 'useCustomRefreshActionProps'`: Use the properties returned by the `useCustomRefreshActionProps` Hooks. Since Schema will be saved to the server, it needs to be used in string format here.
  - `'x-toolbar': 'ActionSchemaToolbar'`: Generally used with the `Action` component. Unlike the default ToolBar, it hides the `Initializer` in the upper right corner of Action, keeping only Drag and Settings.

`useCustomRefreshActionProps`: This is a React Hooks that needs to return the properties of the Action component.
  - [useDataBlockRequest()](https://client.docs.nocobase.com/core/data-block/data-block-request-provider): Request object of the data block, provided internally by `DataBlockProvider`, used to automatically get the data block's data
    - `runAsync`: An asynchronous request method used to refresh the data block's data
  - `type: 'primary'`: Button type is `primary`
  - `onClick`: Click event.

Then export it in `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/initializer/configureActions/items/customRefresh/index.ts`:

```ts
export * from './schema';
```

And modify `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/initializer/configureActions/index.ts` to export `customRefresh`:

```diff
export * from './configureActionsInitializer';
+ export * from './items/customRefresh';
```

##### 3.2.2.2 Register context

We also need to register `useCustomRefreshActionProps` to the context. We modify `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/index.tsx` file:

```diff
// ...
- import { infoInitializerItem } from './initializer';
+ import { infoInitializerItem, useCustomRefreshActionProps } from './initializer';

export class PluginInitializerConfigureActionsClient extends Plugin {
  async load() {
    // ...
-   this.app.addScopes({ useInfoProps });
+   this.app.addScopes({ useInfoProps, useCustomRefreshActionProps });
  }
}
```

For the use of `SchemaComponentOptions`, refer to the [SchemaComponentOptions](https://client.docs.nocobase.com/core/ui-schema/schema-component#schemacomponentoptions) documentation and [Global Registration of Component and Scope](/plugin-samples/component-and-scope/global).

#### 3.3.2 Implement settings

##### 3.3.2.1 Define settings

We create `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/initializer/configureActions/items/customRefresh/settings.ts`

```tsx | pure
import { SchemaSettings } from "@nocobase/client";
import { ActionNameLowercase } from "./constants";

export const customRefreshActionSettings = new SchemaSettings({
  name: `actionSettings:${ActionNameLowercase}`,
  items: [
    {
      name: 'remove',
      type: 'remove',
    }
  ]
})
```

`customRefreshActionSettings`: Here we only simply defined a `remove` operation. For more information about Schema Settings definitions, refer to the [Schema Settings](https://client.docs.nocobase.com/core/ui-schema/schema-settings) documentation.


Modify `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/initializer/configureActions/items/customRefresh/index.ts` to export it:

```tsx | pure
export * from './settings';
```

##### 3.3.2.2 Register settings

Then register `customRefreshActionSettings` to the system. We modify `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/index.tsx` file:

```diff
- import { infoInitializerItem, useCustomRefreshActionProps } from './initializer';
+ import { infoInitializerItem, useCustomRefreshActionProps, customRefreshActionSettings } from './initializer';

export class PluginInitializerConfigureActionsClient extends Plugin {
  async load() {
+   this.app.schemaSettingsManager.add(customRefreshActionSettings);
  }
}
```

##### 3.3.2.2 Use settings

We modify the `customRefreshActionSchema` method in `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/initializer/configureActions/items/customRefresh/schema.ts` file to set `x-settings` to `customRefreshActionSettings.name`.

```diff
+ import { customRefreshActionSettings } from "./settings";

export const customRefreshActionSchema: ISchema = {
  type: 'void',
  'x-component': 'Action',
+ "x-settings": customRefreshActionSettings.name,
  title: 'Custom Refresh',
  'x-use-component-props': 'useCustomRefreshActionProps'
}
```

##### 3.3.3 Define SchemaInitializer item

###### 3.3.3.1 Define SchemaInitializer item

We continue to modify `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/initializer/configureActions/items/customRefresh/initializer.ts` file:

```tsx | pure
import { SchemaInitializerItemType, useSchemaInitializer } from "@nocobase/client";
import { customRefreshActionSchema } from "./schema";
import { ActionName } from "./constants";
import { useT } from "../../../../locale";

export const customRefreshActionInitializerItem: SchemaInitializerItemType = {
  type: 'item',
  name: ActionName,
  useComponentProps() {
    const { insert } = useSchemaInitializer();
    const t = useT();
    return {
      title: t(ActionName),
      onClick() {
        insert(customRefreshActionSchema)
      },
    };
  },
};
```

- `type: 'item'`: Type is `item`, indicating text that triggers `onClick` event when clicked
- `name: 'custom refresh'`: Unique identifier used to distinguish different Schema Items and CRUD operations
- `title: 'Custom Refresh'`: Button title

For more information about Schema Item definitions, refer to the [Schema Initializer Item](https://client.docs.nocobase.com/core/ui-schema/schema-initializer#built-in-components-and-types) documentation.


Then modify `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/initializer/configureActions/index.ts` to export it:

```tsx | pure
export * from './initializer';
```

###### 3.3.3.2 Use SchemaInitializer item

We modify `packages/plugins/@nocobase-sample/plugin-initializer-configure-actions/src/client/initializer/configureActions/configureActionsInitializer.ts` file to add `customRefreshActionInitializerItem` to `items`:

```diff
import { SchemaInitializer } from "@nocobase/client";
+ import { customRefreshActionInitializerItem } from "./items/customRefresh";

export const configureActionsInitializer = new SchemaInitializer({
  name: 'info:configureActions',
  title: 'Configure actions',
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      name: 'customRequest',
      title: '{{t("Custom request")}}',
      Component: 'CustomRequestInitializer',
      'x-align': 'right',
    },
+   customRefreshActionInitializerItem
  ]
});
```

<video width="100%" controls="">
  <source src="https://static-docs.nocobase.com/20240522-191602.mp4" type="video/mp4" />
</video>

You can implement more `Actions` as needed.

## Packaging and Uploading to Production Environment

According to the [Build and Package Plugin](/plugin-development/write-your-first-plugin#build-and-package-plugin) documentation, we can package the plugin and upload it to the production environment.

If you cloned the source code, you need to execute a full build first to build the plugin's dependencies as well.

```bash
yarn build
```

If you used `create-nocobase-app` to create the project, you can directly execute:

```bash
yarn build @nocobase-sample/plugin-initializer-configure-actions --tar
```

This way you can see the `storage/tar/@nocobase-sample/plugin-initializer-configure-actions.tar.gz` file, and then install it by [uploading](/get-started/installation/plugins).
