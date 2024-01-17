import React from 'react';
import { Plugin } from '../application/Plugin';
import { CollapseItemSchemaToolbar } from '../modules/collapse-filter/CollapseItemSchemaToolbar';
import { FormItemSchemaToolbar } from '../modules/form-creation/FormItemSchemaToolbar';
import { ActionSchemaToolbar } from '../modules/table/ActionSchemaToolbar';
import { BlockSchemaToolbar } from '../modules/table/BlockSchemaToolbar';
import { TableColumnSchemaToolbar } from '../modules/table/TableColumnSchemaToolbar';
import { SchemaComponentOptions } from '../schema-component';
import { RecordLink, useParamsFromRecord, useSourceIdFromParentRecord, useSourceIdFromRecord } from './BlockProvider';
import { DetailsBlockProvider, useDetailsBlockProps } from './DetailsBlockProvider';
import { FilterFormBlockProvider } from './FilterFormBlockProvider';
import { FormBlockProvider, useFormBlockProps } from './FormBlockProvider';
import { FormFieldProvider, useFormFieldProps } from './FormFieldProvider';
import { TableBlockProvider, useTableBlockProps } from './TableBlockProvider';
import { TableFieldProvider, useTableFieldProps } from './TableFieldProvider';
import { TableSelectorProvider, useTableSelectorProps } from './TableSelectorProvider';
import * as bp from './hooks';

// TODO: delete this, replaced by `BlockSchemaComponentPlugin`
export const BlockSchemaComponentProvider: React.FC = (props) => {
  return (
    <SchemaComponentOptions
      components={{
        TableFieldProvider,
        TableBlockProvider,
        TableSelectorProvider,
        FormBlockProvider,
        FilterFormBlockProvider,
        FormFieldProvider,
        DetailsBlockProvider,
        RecordLink,
      }}
      scope={{
        ...bp,
        useSourceIdFromRecord,
        useSourceIdFromParentRecord,
        useParamsFromRecord,
        useFormBlockProps,
        useFormFieldProps,
        useDetailsBlockProps,
        useTableFieldProps,
        useTableBlockProps,
        useTableSelectorProps,
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
      TableFieldProvider,
      TableBlockProvider,
      TableSelectorProvider,
      FormBlockProvider,
      FilterFormBlockProvider,
      FormFieldProvider,
      DetailsBlockProvider,
      RecordLink,
      BlockSchemaToolbar,
      ActionSchemaToolbar,
      FormItemSchemaToolbar,
      CollapseItemSchemaToolbar,
      TableColumnSchemaToolbar,
    });
  }

  addScopes() {
    this.app.addScopes({
      ...bp,
      useSourceIdFromRecord,
      useSourceIdFromParentRecord,
      useParamsFromRecord,
      useFormBlockProps,
      useFormFieldProps,
      useDetailsBlockProps,
      useTableFieldProps,
      useTableBlockProps,
      useTableSelectorProps,
    });
  }
}
