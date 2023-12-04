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

```tsx | pure
import React, { useContext } from 'react';
import { Plugin } from '@nocobase/client';

class MyPlugin extends Plugin {
  async load() {
    this.app.schemaInitializerManager.add('BlockInitializers', BlockInitializers)
  }
}
```
