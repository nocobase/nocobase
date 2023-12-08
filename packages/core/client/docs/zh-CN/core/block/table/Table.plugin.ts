import { Plugin } from '@nocobase/client';

import { tableSettings } from './Table.settings';
import { TableToolbar } from './Table.toolbar';
import { useTableProps } from './Table.useProps';
import { useTableDecoratorProps } from './Table.decoratorProps';
import { tableColumnInitializer } from './Table.column.initializer';
import { NocoBaseTable } from './Table';
import { tableColumnSettings } from './Table.column.settings';
import { TableColumn } from './Table.column';
import { TableColumnDecorator } from './Table.column.decorator';

export class TablePlugin extends Plugin {
  async load() {
    this.app.schemaSettingsManager.add(tableSettings, tableColumnSettings);
    this.app.addComponents({ TableToolbar, NocoBaseTable, TableColumn, TableColumnDecorator });
    this.app.addScopes({ useTableProps, useTableDecoratorProps });
    this.app.schemaInitializerManager.add(tableColumnInitializer);
  }
}
