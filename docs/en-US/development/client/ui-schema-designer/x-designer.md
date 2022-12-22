# x-designer

## Built-in x-designer component

- Action.Designer
- Calendar.Designer
- Filter.Action.Designer
- Form.Designer
- FormItem.Designer
- FormV2.Designer
- FormV2.ReadPrettyDesigner
- DetailsDesigner
- G2Plot.Designer
- Kanban.Designer
- Kanban.Card.Designer
- Markdown.Void.Designer
- Menu.Designer
- TableV2.Column.Designer
- TableV2.ActionColumnDesigner
- TableBlockDesigner
- TableSelectorDesigner
- Tabs.Designer

## Replacement

```tsx | pure
import React, { useContext } from 'react';
import { useFieldSchema } from '@formily/react';
import {
  SchemaComponentOptions,
  GeneralSchemaDesigner,
  SchemaSettings,
  useCollection
} from '@nocobase/client';
import React from 'react';

const CustomActionDesigner = () => {
  const { name, title } = useCollection();
  const fieldSchema = useFieldSchema();
  return (
    <GeneralSchemaDesigner title={title || name}>
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};

export default React.memo((props) => {
  return (
    <SchemaComponentOptions
      components={{
        'Action.Designer': CustomActionDesigner,
      }}
    >{props.children}</SchemaComponentOptions>
  );
});
```
