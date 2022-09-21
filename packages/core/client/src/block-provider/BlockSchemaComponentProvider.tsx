import React from 'react';
import { SchemaComponentOptions } from '../schema-component/core/SchemaComponentOptions';
import { RecordLink, useParamsFromRecord, useSourceIdFromParentRecord, useSourceIdFromRecord } from './BlockProvider';
import { CalendarBlockProvider, useCalendarBlockProps } from './CalendarBlockProvider';
import { DetailsBlockProvider, useDetailsBlockProps } from './DetailsBlockProvider';
import { FormBlockProvider, useFormBlockProps } from './FormBlockProvider';
import * as bp from './hooks';
import { KanbanBlockProvider, useKanbanBlockProps } from './KanbanBlockProvider';
import { TableBlockProvider, useTableBlockProps } from './TableBlockProvider';
import { TableFieldProvider, useTableFieldProps } from './TableFieldProvider';
import { TableSelectorProvider, useTableSelectorProps } from './TableSelectorProvider';
import { FormFieldProvider, useFormFieldProps } from './FormFieldProvider';
import {TreeBlockProvider, useTreeBlockProps} from "@nocobase/client";

export const BlockSchemaComponentProvider: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      components={{
        CalendarBlockProvider,
        TableFieldProvider,
        TableBlockProvider,
        TreeBlockProvider,
        TableSelectorProvider,
        FormBlockProvider,
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
        useTreeBlockProps,
        useTableSelectorProps,
        useKanbanBlockProps,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
