# x-initializer

## Built-in x-initializer component

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

## Replacement

```tsx |pure
import React, { useContext } from 'react';
import { Plugin } from '@nocobase/client';

class MyPlugin extends Plugin {
  async load() {
    this.app.schemaInitializerManager.add('BlockInitializers', BlockInitializers)
  }
}
```
