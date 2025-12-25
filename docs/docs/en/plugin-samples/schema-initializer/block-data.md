# Adding Data Block

## Scenario

NocoBase has many `Add block` buttons for adding blocks to the interface. Some are related to data tables and are called data blocks `Data Block`, while others that are not related to data tables are called simple blocks `Simple Block`.

![img_v3_02b4_170eddb5-d3b4-461e-b74b-f83250941e5g](https://static-docs.nocobase.com/img_v3_02b4_170eddb5-d3b4-461e-b74b-f83250941e5g.jpg)

However, the existing block types may not meet our requirements, so we need to develop custom blocks according to our needs. This article focuses on explaining data blocks `Data Block`.

## Example

This example will create an `Info` block and add it to the `Add block` in `Page`, `Table`, and mobile.

This example is mainly to demonstrate the use of initializer. For more information about block extension, please refer to the [Block Extension](/plugin-samples/block) documentation.

The complete example code for this document can be found in [plugin-samples](https://github.com/nocobase/plugin-samples/tree/main/packages/plugins/%40nocobase-sample/plugin-initializer-block-data).

<video width="100%" controls="">
  <source src="https://static-docs.nocobase.com/20240522-182547.mp4" type="video/mp4" />
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
yarn pm create @nocobase-sample/plugin-initializer-block-data
yarn pm enable @nocobase-sample/plugin-initializer-block-data
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


```bash
.
├── client # Client plugin
│   ├── initializer # Initializer
│   ├── component # Block component
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

First, we need to define the block name, which will be used in various places.

We create `packages/plugins/@nocobase-sample/plugin-initializer-block-data/src/client/constants.ts`:

```ts
export const BlockName = 'Info';
export const BlockNameLowercase = BlockName.toLowerCase();
```

### 2. Implement Block Component

#### 2.1 Define Block Component

This example is about an `Info` block component with the following specific requirements:

- Display the current block's data table name
- Display the current block's data list

First, we create `packages/plugins/@nocobase-sample/plugin-initializer-block-data/src/client/component/Info.tsx` file with the following content:

```tsx | pure
import React, { FC } from 'react';
import { withDynamicSchemaProps } from '@nocobase/client'
import { BlockName } from '../constants';

export interface InfoProps {
  collectionName: string;
  data?: any[];
  loading?: boolean;
}

export const Info: FC<InfoProps> = withDynamicSchemaProps(({ collectionName, data }) => {
  return <div>
    <div>collection: {collectionName}</div>
    <div>data list: <pre>{JSON.stringify(data, null, 2)}</pre></div>
  </div>
}, { displayName: BlockName })
```

The `Info` component is essentially a functional component wrapped by `withDynamicSchemaProps`. [withDynamicSchemaProps](/development/client/ui-schema/what-is-ui-schema#x-component-props-和-x-use-component-props) is a higher-order component used to handle dynamic properties in Schema.

If we ignore `withDynamicSchemaProps`, `Info` is just a simple functional component.

Then export it in `packages/plugins/@nocobase-sample/plugin-initializer-block-data/src/client/component/index.ts`:

```tsx | pure
export * from './Info';
```

#### 2.2 Register Block Component

We need to register `Info` to the system through the plugin.

```tsx | pure
import { Plugin } from '@nocobase/client';
import { Info } from './component';

export class PluginInitializerBlockDataClient extends Plugin {
  async load() {
    this.app.addComponents({ Info })
  }
}

export default PluginInitializerBlockDataClient;
```

#### 2.3 Verify Block Component

There are 2 ways to verify components:

- Temporary page verification: We can temporarily create a page and render the `Info` component to check if it meets the requirements
- Documentation example verification: You can start the documentation `yarn doc plugins/@nocobase-sample/plugin-initializer-block-data`, and verify if it meets the requirements by writing documentation examples (TODO)

We use `temporary page verification` as an example. We create a new page and add one or more `Info` components according to property parameters to check if they meet the requirements.

```tsx | pure
import React from 'react';
import { Plugin } from '@nocobase/client';
import { Info } from './component';

export class PluginInitializerBlockDataClient extends Plugin {
  async load() {
    this.app.addComponents({ Info })

    this.app.router.add('admin.info-component', {
      path: '/admin/info-component',
      Component: () => {
        return <>
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <Info collectionName='test' data={[{ id: 1 }, { id: 2 }]} />
          </div>
        </>
      }
    })
  }
}

export default PluginInitializerBlockDataClient;
```

Then visit `http://localhost:13000/admin/info-component` to see the corresponding test page content.

![20240526165834](https://static-docs.nocobase.com/20240526165834.png)

After verification, the test page needs to be deleted.

### 3. Define Block Schema

#### 3.1 Define Block Schema

NocoBase's dynamic pages are all rendered through Schema, so we need to define a Schema, which will be used later to add the `Info` block to the interface. Before implementing this section, we need to understand some basic knowledge:

- [UI Schema Protocol](/development/client/ui-schema/what-is-ui-schema): Detailed introduction to the structure of Schema and the role of each property
- [DataBlockProvider](https://client.docs.nocobase.com/core/data-block/data-block-provider): Data block

We create `packages/plugins/@nocobase-sample/plugin-initializer-block-data/src/client/schema/index.ts` file:

```ts
import { useCollection, useDataBlockRequest } from "@nocobase/client";

import { InfoProps } from "../component";
import { BlockName, BlockNameLowercase } from "../constants";

export function useInfoProps(): InfoProps {
  const collection = useCollection();
  const { data, loading } = useDataBlockRequest<any[]>();

  return {
    collectionName: collection.name,
    data: data?.data,
    loading: loading
  }
}

export function getInfoSchema({ dataSource = 'main', collection }) {
  return {
    type: 'void',
    'x-decorator': 'DataBlockProvider',
    'x-decorator-props': {
      dataSource,
      collection,
      action: 'list',
    },
    'x-component': 'CardItem',
    "x-toolbar": "BlockSchemaToolbar",
    properties: {
      [BlockNameLowercase]: {
        type: 'void',
        'x-component': BlockName,
        'x-use-component-props': 'useInfoProps',
      }
    }
  }
}
```

There are 2 points to explain here:

- `getInfoSchema()`: The reason for defining it as a function is that `dataSource` and `collection` are dynamic and determined by the clicked data table
- `useInfoProps()`: Used to handle the dynamic properties of the `Info` component, and because it needs to be stored in the database, the value type here is a string type.

`getInfoSchema()`: Returns the Schema of Info
  - `type: 'void'`: Indicates no data
  - `x-decorator: 'DataBlockProvider'`: Data block provider, used to provide data. For more information about DataBlockProvider, please refer to [DataBlockProvider](https://client.docs.nocobase.com/core/data-block/data-block-provider)
  - `x-decorator-props`: Properties of `DataBlockProvider`
    - `dataSource`: Data source
    - `collection`: Data table
    - `action: 'list'`: Operation type, here it is `list`, to get the data list
  - `x-component: 'CardItem'`: [CardItem component](https://client.docs.nocobase.com/components/card-item), currently all blocks are wrapped in cards, which provide styles, layouts, and drag-and-drop functionality
  - `properties`: Child nodes
    - `info`: Info block

`useInfoProps()`: Dynamic properties of the Info component
  - [useCollection](https://client.docs.nocobase.com/core/data-source/collection-provider#usecollection): Get the current data table, provided by [DataBlockProvider](https://client.docs.nocobase.com/core/data-block/data-block-provider)
  - [useDataBlockRequest](https://client.docs.nocobase.com/core/data-block/data-block-request-provider#usedatablockrequest) Get the data block request, provided by [DataBlockProvider](https://client.docs.nocobase.com/core/data-block/data-block-provider)

The above Schema is equivalent to the following React component:

```tsx | pure
<DataBlockProvider collection={collection} dataSource={dataSource} action='list'>
  <CardItem>
    <Info {...useInfoProps()} />
  </CardItem>
</DataBlockProvider>
```

#### 3.2 Register scope

We need to register `useInfoProps` to the system, so that [x-use-component-props](/development/client/ui-schema/what-is-ui-schema#x-component-props-和-x-use-component-props) can find the corresponding scope.

```tsx | pure
import { Plugin } from '@nocobase/client';
import { Info } from './component';
import { useInfoProps } from './schema';

export class PluginInitializerBlockDataClient extends Plugin {
  async load() {
    this.app.addComponents({ Info })
    this.app.addScopes({ useInfoProps });
  }
}

export default PluginInitializerBlockDataClient;
```

For more information about Scope, please refer to [Global Registration of Component and Scope](/plugin-samples/component-and-scope/global)

#### 3.3 Verify Block Schema

Same as verifying components, we can verify the Schema by temporary page verification or documentation example verification. Here we use temporary page verification as an example:

```tsx | pure
import React from 'react';
import { Plugin, SchemaComponent, SchemaComponentOptions } from '@nocobase/client';
import { Info } from './component';
import { getInfoSchema, useInfoProps } from './schema';

export class PluginInitializerBlockDataClient extends Plugin {
  async load() {
    // ...
    this.app.router.add('admin.info-schema', {
      path: '/admin/info-schema',
      Component: () => {
        return <>
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <SchemaComponent schema={{ properties: { test1: getInfoSchema({ collection: 'users' }) } }} />
          </div>

          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <SchemaComponent schema={{ properties: { test2: getInfoSchema({ collection: 'roles' }) } }} />
          </div>
        </>
      }
    })
  }
}

export default PluginInitializerBlockDataClient;
```

- [SchemaComponentOptions](https://client.docs.nocobase.com/core/ui-schema/schema-component#schemacomponentoptions): Used to pass `components` and `scope` required in Schema. For details, please refer to [Local Registration of Component and Scope](/plugin-samples/component-and-scope/local)
- [SchemaComponent](https://client.docs.nocobase.com/core/ui-schema/schema-component#schemacomponent-1): Used to render Schema

We visit [http://localhost:13000/admin/info-schema](http://localhost:13000/admin/info-schema) to see the corresponding test page content.

![20240526170053](https://static-docs.nocobase.com/20240526170053.png)

After verification, the test page needs to be deleted.

### 4. Define Schema Initializer Item

We create `packages/plugins/@nocobase-sample/plugin-initializer-block-data/src/client/initializer/index.tsx` file:

```tsx | pure
import React from 'react';
import { SchemaInitializerItemType, useSchemaInitializer } from '@nocobase/client'
import { CodeOutlined } from '@ant-design/icons';

import { getInfoSchema } from '../schema'
import { useT } from '../locale';
import { BlockName, BlockNameLowercase } from '../constants';

export const infoInitializerItem: SchemaInitializerItemType = {
  name: BlockNameLowercase,
  Component: 'DataBlockInitializer',
  useComponentProps() {
    const { insert } = useSchemaInitializer();
    const t = useT();
    return {
      title: t(BlockName),
      icon: <CodeOutlined />,
      componentType: BlockName,
      useTranslationHooks: useT,
      onCreateBlockSchema({ item }) {
        insert(getInfoSchema({ dataSource: item.dataSource, collection: item.name }))
      },
    };
  },
}
```

The core to achieving the data block effect is DataBlockInitializer (documentation TODO).

`infoInitializerItem`:
  - `Component`: Unlike [Adding Simple Block Simple Block](/plugin-samples/schema-initializer/block-simple) which uses `type`, here we use `Component`. [2 ways to define](https://client.docs.nocobase.com/core/ui-schema/schema-initializer#two-ways-to-define-component-and-type) are both acceptable
  - `useComponentProps`: Properties of `DataBlockInitializer` component
    - `title`: Title
    - `icon`: Icon, more icons can be found at [Ant Design Icons](https://ant.design/components/icon/)
    - `componentType`: Component type, here it is `Info`
    - `onCreateBlockSchema`: Callback after clicking the data table
      - `item`: Information of the clicked data table
        - `item.name`: Data table name
        - `item.dataSource`: Data source of the data table
    - [useSchemaInitializer](https://client.docs.nocobase.com/core/ui-schema/schema-initializer#useschemainitializer): Provides methods for inserting Schema
  - `"x-toolbar": "BlockSchemaToolbar"`: `BlockSchemaToolbar` is used to display the current data table in the upper left corner, usually used with `DataBlockProvider`

For more information about Schema Initializer definitions, please refer to the [Schema Initializer](https://client.docs.nocobase.com/core/ui-schema/schema-initializer) documentation.

### 5. Implement Schema Settings

#### 5.1 Define Schema Settings

A complete Block also needs to have Schema Settings, which are used to configure some properties and operations, but Schema Settings is not the focus of this example, so we only have a `remove` operation here.

We create `packages/plugins/@nocobase-sample/plugin-initializer-block-data/src/client/settings/index.ts` file:

```ts
import { SchemaSettings } from "@nocobase/client";
import { BlockNameLowercase } from "../constants";

export const infoSettings = new SchemaSettings({
  name: `blockSettings:${BlockNameLowercase}`,
  items: [
    {
      type: 'remove',
      name: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: {
          'x-component': 'Grid',
        },
      }
    }
  ]
})
```

#### 5.2 Register Schema Settings

```ts
import { Plugin } from '@nocobase/client';
import { infoSettings } from './settings';

export class PluginInitializerBlockDataClient extends Plugin {
  async load() {
    // ...
    this.app.schemaSettingsManager.add(infoSettings)
  }
}

export default PluginInitializerBlockDataClient;
```

#### 5.3 Use Schema Settings

We modify the `getInfoSchema` method in the `packages/plugins/@nocobase-sample/plugin-initializer-block-data/src/client/schema/index.ts` file to set `x-settings` to `infoSettings.name`.

```diff
+ import { infoSettings } from "../settings";

export function getInfoSchema({ dataSource = 'main', collection }) {
  return {
    type: 'void',
    'x-decorator': 'DataBlockProvider',
+   'x-settings': infoSettings.name,
    // ...
  }
}
```

### 6. Add to Add block

There are many `Add block` buttons in the system, but their **names are different**.

![img_v3_02b4_049b0a62-8e3b-420f-adaf-a6350d84840g](https://static-docs.nocobase.com/img_v3_02b4_049b0a62-8e3b-420f-adaf-a6350d84840g.jpg)

#### 6.1 Add to Page-level Add block

If we need to add it to the page-level `Add block`, we need to know the corresponding `name`. We can view the corresponding `name` through TODO method.

TODO

From the above figure, we can see that the page-level `Add block` corresponds to the name `page:addBlock`, and `Data Blocks` corresponds to the name `dataBlocks`.

Then we modify `packages/plugins/@nocobase-sample/plugin-initializer-block-data/src/client/index.tsx` file:

```tsx | pure
import { Plugin } from '@nocobase/client';
import { Info } from './component';
import { useInfoProps } from './schema';
import { infoSettings } from './settings';
import { infoInitializerItem } from './initializer';

export class PluginDataBlockInitializerClient extends Plugin {
  async load() {
    this.app.addComponents({ Info });
    this.app.addScopes({ useInfoProps });

    this.app.schemaSettingsManager.add(infoSettings);

    this.app.schemaInitializerManager.addItem('page:addBlock', `dataBlocks.${infoInitializerItem.name}`, infoInitializerItem)
  }
}

export default PluginDataBlockInitializerClient;
```

<video controls width='100%' src="https://static-docs.nocobase.com/20240526170424_rec_.mp4"></video>

#### 6.2 Add to Modal Add block

We need to add it not only to the page-level `Add block`, but also to the `Add block` in the `Table` block `Add new` modal.

![img_v3_02b4_fc47fe3a-35a1-4186-999c-0b48e6e001dg](https://static-docs.nocobase.com/img_v3_02b4_fc47fe3a-35a1-4186-999c-0b48e6e001dg.jpg)

According to the method of obtaining the page-level `name`, we get the `Add block` name of the `Table` block as `popup:addNew:addBlock`, and `Data Blocks` corresponds to the name `dataBlocks`.

Then modify `packages/plugins/@nocobase-sample/plugin-initializer-block-data/src/client/index.tsx` file:

```diff
import { Plugin } from '@nocobase/client';
import { Plugin } from '@nocobase/client';
import { Info } from './component';
import { useInfoProps } from './schema';
import { infoSettings } from './settings';
import { infoInitializerItem } from './initializer';

export class PluginDataBlockInitializerClient extends Plugin {
  async load() {
    this.app.addComponents({ Info });
    this.app.addScopes({ useInfoProps });

    this.app.schemaSettingsManager.add(infoSettings);

    this.app.schemaInitializerManager.addItem('page:addBlock', `dataBlocks.${infoInitializerItem.name}`, infoInitializerItem)
+   this.app.schemaInitializerManager.addItem('popup:addNew:addBlock', `dataBlocks.${infoInitializerItem.name}`, infoInitializerItem)
  }
}

export default PluginDataBlockInitializerClient;

```

![img_v3_02b4_7062bfab-5a7b-439c-b385-92c5704b6b3g](https://static-docs.nocobase.com/img_v3_02b4_7062bfab-5a7b-439c-b385-92c5704b6b3g.jpg)

#### 6.3 Add to Mobile Add block

> First, you need to activate the mobile plugin, refer to the [Activate Plugin](/get-started/installation/plugins) documentation.

We can add it to the mobile `Add block`. The method of obtaining the `name` will not be repeated here.

Then modify `packages/plugins/@nocobase-sample/plugin-initializer-block-data/src/client/index.tsx` file:

```diff
import { Plugin } from '@nocobase/client';
import { Info } from './component';
import { useInfoProps } from './schema';
import { infoSettings } from './settings';
import { infoInitializerItem } from './initializer';

export class PluginDataBlockInitializerClient extends Plugin {
  async load() {
    this.app.addComponents({ Info });
    this.app.addScopes({ useInfoProps });

    this.app.schemaSettingsManager.add(infoSettings);

    this.app.schemaInitializerManager.addItem('page:addBlock', `dataBlocks.${infoInitializerItem.name}`, infoInitializerItem)
    this.app.schemaInitializerManager.addItem('popup:addNew:addBlock', `dataBlocks.${infoInitializerItem.name}`, infoInitializerItem)
+   this.app.schemaInitializerManager.addItem('mobilePage:addBlock', `dataBlocks.${infoInitializerItem.name}`, infoInitializerItem)
  }
}

export default PluginDataBlockInitializerClient;
```

If you need more `Add block`, you can continue to add them, just need to know the corresponding `name`.

## Packaging and Uploading to Production Environment

According to the [Build and Package Plugin](/plugin-development/write-your-first-plugin#build-and-package-plugin) documentation, we can package the plugin and upload it to the production environment.

If you cloned the source code, you need to execute a full build first to build the plugin's dependencies as well.

```bash
yarn build
```

If you used `create-nocobase-app` to create the project, you can directly execute:

```bash
yarn build @nocobase-sample/plugin-initializer-block-data --tar
```

This way you can see the `storage/tar/@nocobase-sample/plugin-initializer-block-data.tar.gz` file, and then install it by [uploading](/get-started/installation/plugins).
