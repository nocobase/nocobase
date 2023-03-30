import React from 'react';
import { SchemaComponentOptions } from '../schema-component/core/SchemaComponentOptions';
import { RecordLink, useParamsFromRecord, useSourceIdFromParentRecord, useSourceIdFromRecord } from './BlockProvider';
import { CalendarBlockProvider, useCalendarBlockProps } from './CalendarBlockProvider';
import { DetailsBlockProvider, useDetailsBlockProps } from './DetailsBlockProvider';
import { FilterFormBlockProvider } from './FilterFormBlockProvider';
import { FormBlockProvider, useFormBlockProps } from './FormBlockProvider';
import { FormFieldProvider, useFormFieldProps } from './FormFieldProvider';
import * as bp from './hooks';
import { KanbanBlockProvider, useKanbanBlockProps } from './KanbanBlockProvider';
import { TableBlockProvider, useTableBlockProps } from './TableBlockProvider';
import { TableFieldProvider, useTableFieldProps } from './TableFieldProvider';
import { TableSelectorProvider, useTableSelectorProps } from './TableSelectorProvider';

export const BlockSchemaComponentProvider: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      components={{
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
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
