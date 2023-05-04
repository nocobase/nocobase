import React from 'react';
import { SchemaComponentOptions } from '../schema-component/core/SchemaComponentOptions';
import { RecordLink, useParamsFromRecord, useSourceIdFromParentRecord, useSourceIdFromRecord } from './BlockProvider';
import { CalendarBlockProvider, useCalendarBlockProps } from './CalendarBlockProvider';
import { DetailsBlockProvider, useDetailsBlockProps } from './DetailsBlockProvider';
import { FilterFormBlockProvider } from './FilterFormBlockProvider';
import { FormBlockProvider, useFormBlockProps } from './FormBlockProvider';
import * as bp from './hooks';
import { KanbanBlockProvider, useKanbanBlockProps } from './KanbanBlockProvider';
import { TableBlockProvider, useTableBlockProps } from './TableBlockProvider';
import { TableFieldProvider, useTableFieldProps } from './TableFieldProvider';
import { TableSelectorProvider, useTableSelectorProps } from './TableSelectorProvider';
import { FormFieldProvider, useFormFieldProps } from './FormFieldProvider';
import { GanttBlockProvider, useGanttBlockProps } from './GanttBlockProvider';
import { SubTableProvider, useSubTableProps } from './SubTableProvider';


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
        SubTableProvider,
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
        useSubTableProps,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
