# Adding a New Simple Block

## Scenario

NocoBase has many `Add block` buttons for adding blocks to the interface. Some are related to data tables and are called data blocks `Data Block`, while others that are not related to data tables are called simple blocks `Simple Block`.

![img_v3_02b4_a4529308-62e3-4fa7-be4d-5dcae332c49g](https://static-docs.nocobase.com/img_v3_02b4_a4529308-62e3-4fa7-be4d-5dcae332c49g.jpg)

However, the existing block types may not meet our requirements, so we need to develop custom blocks according to our needs. This article focuses on explaining simple blocks `Simple Block`.

## Example

This example will create an image block type and add it to the `Add block` in `Page`, `Table`, and mobile.

This example is mainly to demonstrate the use of initializer. For more information about block extension, please refer to the [Block Extension](/plugin-samples/block) documentation.

The complete example code for this document can be found in [plugin-samples](https://github.com/nocobase/plugin-samples/tree/main/packages/plugins/%40nocobase-sample/plugin-initializer-block-simple).

<video width="100%" controls="">
  <source src="https://static-docs.nocobase.com/20240522-181816.mp4" type="video/mp4" />
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
yarn pm create @nocobase-sample/plugin-initializer-block-simple
yarn pm enable @nocobase-sample/plugin-initializer-block-simple
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
- [UI Schema Protocol](/development/client/ui-schema/what-is-ui-schema): Detailed introduction to the structure of Schema and the role of each property
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

We create `packages/plugins/@nocobase-sample/plugin-initializer-block-simple/src/client/constants.ts`:

```ts
export const BlockName = 'Image';
export const BlockNameLowercase = BlockName.toLowerCase();
```

### 2. Implement Block Component

#### 2.1 Define Block Component

This example is about an image block component, so we name it `Image`.

We create `packages/plugins/@nocobase-sample/plugin-initializer-block-simple/src/client/component/Image.tsx` file with the following content:

```tsx | pure
import React, { FC } from 'react';
import { withDynamicSchemaProps } from '@nocobase/client';
import { BlockName } from '../constants';

export const Image: FC<{ height?: number }> = withDynamicSchemaProps(({ height = 500 }) => {
  return <div style={{ height }}>
    <img
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      src="https://picsum.photos/2000/500"
    />
  </div>
}, { displayName: BlockName })
```

The `Image` component is essentially a functional component wrapped by `withDynamicSchemaProps`. [withDynamicSchemaProps](/development/client/ui-schema/what-is-ui-schema#x-component-props-和-x-use-component-props) is a higher-order component used to handle dynamic properties in Schema.

If we ignore `withDynamicSchemaProps`, `Image` is just a simple functional component.

Then export it in `packages/plugins/@nocobase-sample/plugin-initializer-block-simple/src/client/component/index.ts`:

```tsx | pure
export * from './Image';
```

#### 2.2 Register Block Component

We need to register `Image` to the system through the plugin.

```tsx | pure
import { Plugin } from '@nocobase/client';
import { Image } from './component'

export class PluginInitializerBlockSimpleClient extends Plugin {
  async load() {
    this.app.addComponents({ Image })
  }
}

export default PluginInitializerBlockSimpleClient;
```

#### 2.3 Verify Block Component

There are 2 ways to verify components:

- Temporary page verification: We can temporarily create a page and render the `Image` component to check if it meets the requirements
- Documentation example verification: You can start the documentation `yarn doc plugins/@nocobase-sample/plugin-initializer-block-simple`, and verify if it meets the requirements by writing documentation examples (TODO)

We use `temporary page verification` as an example. We create a new page and add one or more `Image` components according to property parameters to check if they meet the requirements.

```tsx | pure
import React from 'react';
import { Plugin } from '@nocobase/client';
import { Image } from './component'

export class PluginInitializerBlockSimpleClient extends Plugin {
  async load() {
    this.app.addComponents({ Image })

    this.app.router.add('admin.image-component', {
      path: '/admin/image-component',
      Component: () => {
        return <>
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <Image />
          </div>

          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <Image height={400} />
          </div>
        </>
      }
    })
  }
}

export default PluginInitializerBlockSimpleClient;
```

Then visit `http://localhost:13000/admin/image-component` to see the corresponding test page content.

![20240526165057](https://static-docs.nocobase.com/20240526165057.png)

After verification, the test page needs to be deleted.

### 3. Define Block Schema

#### 3.1 Define Block Schema

NocoBase's dynamic pages are all rendered through Schema, so we need to define a Schema, which will be used later to add the `Image` block to the interface. Before implementing this section, we need to understand some basic knowledge:

- [UI Schema Protocol](/development/client/ui-schema/what-is-ui-schema): Detailed introduction to the structure of Schema and the role of each property

We create `packages/plugins/@nocobase-sample/plugin-initializer-block-simple/src/client/schema/index.ts` file:

```tsx | pure
import { ISchema } from "@nocobase/client";
import { BlockName, BlockNameLowercase } from "../constants";

export const imageSchema: ISchema = {
  type: 'void',
  'x-component': 'CardItem',
  properties: {
    [BlockNameLowercase]: {
      'x-component': BlockName,
    }
  }
};
```

Details about `imageSchema`:

- `type`: Type, here it is `void`, indicating a pure UI node with no data
- `x-decorator`: Decorator, here it is [CardItem component](https://client.docs.nocobase.com/components/card-item), currently all blocks are wrapped in cards, which provide styles, layouts, and drag-and-drop functionality
- `x-component`: Component, here it is `Image`, which is the component we just defined

The above Schema is equivalent to the following React component:

```tsx | pure
<CardItem>
  <Image />
</CardItem>
```

#### 3.2 Verify Block Schema

Same as verifying components, we can verify the Schema by temporary page verification or documentation example verification. Here we use temporary page verification as an example:

```tsx | pure
import React from 'react';
import { Plugin, SchemaComponent } from '@nocobase/client';
import { Image } from './component'
import { imageSchema } from './schema'

export class PluginInitializerBlockSimpleClient extends Plugin {
  async load() {
    this.app.addComponents({ Image })

    this.app.router.add('admin.image-schema', {
      path: '/admin/image-schema',
      Component: () => {
        return <div style={{ marginTop: 20, marginBottom: 20 }}>
          <SchemaComponent schema={{ properties: { test: imageSchema } }} />
        </div>
      }
    })
  }
}

export default PluginInitializerBlockSimpleClient;
```

For detailed explanation of `SchemaComponent`, please refer to the [SchemaComponent](https://client.docs.nocobase.com/core/ui-schema/schema-component#schemacomponent-1) documentation.

We visit [http://localhost:13000/admin/image-schema](http://localhost:13000/admin/image-schema) to see the corresponding test page content.

![20240526165408](https://static-docs.nocobase.com/20240526165408.png)

After verification, the test page needs to be deleted.

### 4. Define Schema Initializer Item

We create `packages/plugins/@nocobase-sample/plugin-initializer-block-simple/src/client/initializer/index.ts` file:

```ts
import { SchemaInitializerItemType, useSchemaInitializer } from '@nocobase/client';

import { useT } from '../locale';
import { imageSchema } from '../schema';
import { BlockName, BlockNameLowercase } from '../constants';

export const imageInitializerItem: SchemaInitializerItemType = {
  type: 'item',
  name: BlockNameLowercase,
  icon: 'FileImageOutlined',
  useComponentProps() {
    const { insert } = useSchemaInitializer();
    const t = useT()
    return {
      title: t(BlockName),
      onClick: () => {
        insert(imageSchema);
      },
    };
  },
}
```

- `type`: Type, here it is `item`, indicating a text with a click event that can insert a new Schema when clicked
- `name`: Unique identifier used to distinguish different Schema Items and CRUD operations
- `icon`: Icon, more icons can be found at [Ant Design Icons](https://ant.design/components/icon)
- `useComponentProps`: Returns an object containing `title` and `onClick` properties, `title` is the displayed text, `onClick` is the callback function after clicking
- [useSchemaInitializer()](https://client.docs.nocobase.com/core/ui-schema/schema-initializer#useschemainitializer): Used to get the `SchemaInitializerContext` context
  - `insert`: Insert a new Schema

For more information about Schema Item definitions, please refer to the [Schema Initializer Item](https://client.docs.nocobase.com/core/ui-schema/schema-initializer#built-in-components-and-types) documentation.

### 5. Implement Schema Settings

#### 5.1 Define Schema Settings

A complete Block also needs to have Schema Settings, which are used to configure some properties and operations, but Schema Settings is not the focus of this example, so we only have a `remove` operation here.

We create `packages/plugins/@nocobase-sample/plugin-initializer-block-simple/src/client/settings/index.ts` file:

```ts | pure
import { SchemaSettings } from "@nocobase/client";
import { BlockNameLowercase } from "../constants";

export const imageSettings = new SchemaSettings({
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
});
```

- componentProps
  - `removeParentsIfNoChildren`: Whether to delete the parent node if there are no child nodes
  - `breakRemoveOn`: Break condition when deleting. Because `Add Block` automatically wraps children in `Grid`, we set `breakRemoveOn: { 'x-component': 'Grid' }` here, so when deleting `Grid`, it doesn't delete upwards anymore.

#### 5.2 Register Schema Settings

```ts
import { Plugin } from '@nocobase/client';
import { imageSettings } from './settings';

export class PluginInitializerBlockSimpleClient extends Plugin {
  async load() {
    // ...
    this.app.schemaSettingsManager.add(imageSettings)
  }
}

export default PluginInitializerBlockSimpleClient;
```

#### 5.3 Use Schema Settings

We modify `packages/plugins/@nocobase-sample/plugin-initializer-block-simple/src/client/schema/index.ts` in the `imageSchema`:

```diff
+ import { imageSettings } from "../settings";

const imageSchema: ISchema = {
  type: 'void',
  'x-decorator': 'CardItem',
+ 'x-settings': imageSettings.name,
  // ...
};
```

### 6. Add to Add block

There are many `Add block` buttons in the system, but their **names are different**.

![img_v3_02b4_049b0a62-8e3b-420f-adaf-a6350d84840g](https://static-docs.nocobase.com/img_v3_02b4_049b0a62-8e3b-420f-adaf-a6350d84840g.jpg)

#### 6.1 Add to Page-level Add block

If we need to add it to the page-level `Add block`, we need to know the corresponding `name`. We can view the corresponding `name` through TODO method.

TODO

From the above figure, we can see that the page-level `Add block` corresponds to the name `page:addBlock`, and `Other Blocks` corresponds to the name `otherBlocks`.

Then we modify `packages/plugins/@nocobase-sample/plugin-initializer-block-simple/src/client/index.tsx` file:

```tsx | pure
import { Plugin } from '@nocobase/client';

import { Image } from './component'
import { imageSettings } from './settings';
import { imageInitializerItem } from './initializer';

export class PluginInitializerBlockSimpleClient extends Plugin {
  async load() {
    this.app.addComponents({ Image })
    this.app.schemaSettingsManager.add(imageSettings)
    this.app.schemaInitializerManager.addItem('page:addBlock', `otherBlocks.${imageInitializerItem.name}`, imageInitializerItem)
  }
}

export default PluginInitializerBlockSimpleClient;
```

The above code first registers the `Image` component to the system, so that the `x-component: 'Image'` defined in `imageSchema` can find the corresponding component. For more detailed explanation, please refer to [Global Registration of Component and Scope](/plugin-samples/component-and-scope/global).

Then add `imageSettings` to the system through [app.schemaSettingsManager.add](https://client.docs.nocobase.com/core/ui-schema/schema-settings-manager#schemasettingsmanageradd).

Then use [app.schemaInitializerManager.addItem](https://client.docs.nocobase.com/core/ui-schema/schema-initializer-manager#schemainitializermanageradditem) to add `imageInitializerItem` to the corresponding Initializer sub-item, where `page:addBlock` is the name of `Add block` on the page, and `otherBlocks` is the name of its parent.

Then hover over the `Add block` button, and you can see the new block type `Image`. Click `Image` to add a new `Image` block.

<video width="100%" controls="">
  <source src="https://static-docs.nocobase.com/20240522-175523.mp4" type="video/mp4" />
</video>

#### 6.2 Add to Modal Add block

We need to add it not only to the page-level `Add block`, but also to the `Add block` in the `Table` block `Add new` modal.

![img_v3_02b4_fc47fe3a-35a1-4186-999c-0b48e6e001dg](https://static-docs.nocobase.com/img_v3_02b4_fc47fe3a-35a1-4186-999c-0b48e6e001dg.jpg)

According to the method of obtaining the page-level `name`, we get the `Add block` name of the `Table` block as `popup:addNew:addBlock`, and `Other Blocks` corresponds to the name `otherBlocks`.

Then modify `packages/plugins/@nocobase-sample/plugin-initializer-block-simple/src/client/index.tsx` file:

```diff
export class PluginInitializerBlockSimpleClient extends Plugin {
  async load() {
    this.app.addComponents({ Image })
    this.app.schemaSettingsManager.add(imageSettings)

    this.app.schemaInitializerManager.addItem('page:addBlock', `otherBlocks.${imageInitializerItem.name}`, imageInitializerItem)
+   this.app.schemaInitializerManager.addItem('popup:addNew:addBlock', `otherBlocks.${imageInitializerItem.name}`, imageInitializerItem)
  }
}
```

![img_v3_02b4_7062bfab-5a7b-439c-b385-92c5704b6b3g](https://static-docs.nocobase.com/img_v3_02b4_7062bfab-5a7b-439c-b385-92c5704b6b3g.jpg)

#### 6.3 Add to Mobile Add block

> First, you need to activate the mobile plugin, refer to the [Activate Plugin](/get-started/installation/plugins) documentation.

We can add it to the mobile `Add block`. The method of obtaining the `name` will not be repeated here.

Then modify `packages/plugins/@nocobase-sample/plugin-initializer-block-simple/src/client/index.tsx` file:

```diff
export class PluginInitializerBlockSimpleClient extends Plugin {
  async load() {
    this.app.addComponents({ Image })
    this.app.schemaSettingsManager.add(imageSettings)

    this.app.schemaInitializerManager.addItem('page:addBlock', `otherBlocks.${imageInitializerItem.name}`, imageInitializerItem)
    this.app.schemaInitializerManager.addItem('popup:addNew:addBlock', `otherBlocks.${imageInitializerItem.name}`, imageInitializerItem)
+   this.app.schemaInitializerManager.addItem('mobilePage:addBlock', `otherBlocks.${imageInitializerItem.name}`, imageInitializerItem)
  }
}
```

![img_v3_02b4_ec873b25-5a09-4f3a-883f-1d722035799g](https://static-docs.nocobase.com/img_v3_02b4_ec873b25-5a09-4f3a-883f-1d722035799g.jpg)

If you need more `Add block`, you can continue to add them, just need to know the corresponding `name`.

## Packaging and Uploading to Production Environment

According to the [Build and Package Plugin](/plugin-development/write-your-first-plugin#build-and-package-plugin) documentation, we can package the plugin and upload it to the production environment.

If you cloned the source code, you need to execute a full build first to build the plugin's dependencies as well.

```bash
yarn build
```

If you used `create-nocobase-app` to create the project, you can directly execute:

```bash
yarn build @nocobase-sample/plugin-initializer-block-simple --tar
```

This way you can see the `storage/tar/@nocobase-sample/plugin-initializer-block-simple.tar.gz` file, and then install it by [uploading](/get-started/installation/plugins).
