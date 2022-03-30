import React from 'react';
import { SchemaComponentOptions } from '../schema-component/core/SchemaComponentOptions';
import { useParamsFromRecord, useSourceIdFromParentRecord, useSourceIdFromRecord } from './BlockProvider';
import { CalendarBlockProvider, useCalendarBlockProps } from './CalendarBlockProvider';
import { FormBlockProvider, useFormBlockProps } from './FormBlockProvider';
import { KanbanBlockProvider, useKanbanBlockProps } from './KanbanBlockProvider';
import { TableBlockProvider, useTableBlockProps } from './TableBlockProvider';
import { TableFieldProvider, useTableFieldProps } from './TableFieldProvider';

export const BlockSchemaComponentProvider: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      components={{
        CalendarBlockProvider,
        TableFieldProvider,
        TableBlockProvider,
        FormBlockProvider,
        KanbanBlockProvider,
      }}
      scope={{
        useSourceIdFromRecord,
        useSourceIdFromParentRecord,
        useParamsFromRecord,
        useCalendarBlockProps,
        useFormBlockProps,
        useTableFieldProps,
        useTableBlockProps,
        useKanbanBlockProps,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
