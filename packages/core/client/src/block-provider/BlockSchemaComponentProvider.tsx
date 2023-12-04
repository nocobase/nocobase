import React from 'react';
import { Plugin } from '../application/Plugin';
import { SchemaComponentOptions } from '../schema-component';
import { RecordLink, useParamsFromRecord, useSourceIdFromParentRecord, useSourceIdFromRecord } from './BlockProvider';
import { CalendarBlockProvider, useCalendarBlockProps } from './CalendarBlockProvider';
import { DetailsBlockProvider, useDetailsBlockProps } from './DetailsBlockProvider';
import { FilterFormBlockProvider } from './FilterFormBlockProvider';
import { FormBlockProvider, useFormBlockProps } from './FormBlockProvider';
import { FormFieldProvider, useFormFieldProps } from './FormFieldProvider';
import { GanttBlockProvider, useGanttBlockProps } from './GanttBlockProvider';
import * as bp from './hooks';
import { KanbanBlockProvider, useKanbanBlockProps } from './KanbanBlockProvider';
import { TableBlockProvider, useTableBlockProps } from './TableBlockProvider';
import { TableFieldProvider, useTableFieldProps } from './TableFieldProvider';
import { TableSelectorProvider, useTableSelectorProps } from './TableSelectorProvider';
import { TreeBlockProvider, useTreeBlockProps } from './TreeBlockProvider';
// TODO: delete this, replaced by `BlockSchemaComponentPlugin`
export const BlockSchemaComponentProvider: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      components={{
        GanttBlockProvider,
        CalendarBlockProvider,
        TableFieldProvider,
        TableBlockProvider,
        TableSelectorProvider,
        FormBlockProvider,
        FilterFormBlockProvider,
        FormFieldProvider,
        DetailsBlockProvider,
        KanbanBlockProvider,
        RecordLink,
        TreeBlockProvider
      }}
      scope={{
        ...bp,
        useSourceIdFromRecord,
        useSourceIdFromParentRecord,
        useParamsFromRecord,
        useCalendarBlockProps,
        useFormBlockProps,
        useFormFieldProps,
        useDetailsBlockProps,
        useTableFieldProps,
        useTableBlockProps,
        useTableSelectorProps,
        useKanbanBlockProps,
        useGanttBlockProps,
        useTreeBlockProps,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};

export class BlockSchemaComponentPlugin extends Plugin {
  async load() {
    this.addComponents();
    this.addScopes();
  }

  addComponents() {
    this.app.addComponents({
      GanttBlockProvider,
      CalendarBlockProvider,
      TableFieldProvider,
      TableBlockProvider,
      TableSelectorProvider,
      FormBlockProvider,
      FilterFormBlockProvider,
      FormFieldProvider,
      DetailsBlockProvider,
      KanbanBlockProvider,
      RecordLink,
      TreeBlockProvider
    });
  }

  addScopes() {
    this.app.addScopes({
      ...bp,
      useSourceIdFromRecord,
      useSourceIdFromParentRecord,
      useParamsFromRecord,
      useCalendarBlockProps,
      useFormBlockProps,
      useFormFieldProps,
      useDetailsBlockProps,
      useTableFieldProps,
      useTableBlockProps,
      useTableSelectorProps,
      useKanbanBlockProps,
      useGanttBlockProps,
      useTreeBlockProps
    });
  }
}
