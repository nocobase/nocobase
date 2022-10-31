# x-initializer 组件

## 内置 x-initializer 组件

- BlockInitializers
- CalendarActionInitializers
- CreateFormBlockInitializers
- CustomFormItemInitializers
- DetailsActionInitializers
- FormActionInitializers
- FormItemInitializers
- KanbanActionInitializers
- ReadPrettyFormActionInitializers
- ReadPrettyFormItemInitializers
- RecordBlockInitializers
- RecordFormBlockInitializers
- SubTableActionInitializers
- TableActionColumnInitializers
- TableActionInitializers
- TableColumnInitializers
- TableSelectorInitializers
- TabPaneInitializers

## 替换

```tsx |pure
import React, { useContext } from 'react';
import { SchemaInitializerContext } from '@nocobase/client';

export default React.memo((props) => {
  const items = useContext(SchemaInitializerContext);
  const BlockInitializers = {};
  return (
    <SchemaInitializerContext.Provider value={{ ...items, BlockInitializers }}>
      {props.children}
    </SchemaInitializerContext.Provider>
  );
});
```
