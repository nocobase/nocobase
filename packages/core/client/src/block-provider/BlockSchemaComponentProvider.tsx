import React from 'react';
import { Plugin } from '../application/Plugin';
import { ActionSchemaToolbar } from '../modules/actions/ActionSchemaToolbar';
import { BlockSchemaToolbar } from '../modules/blocks/BlockSchemaToolbar';
import { FormItemSchemaToolbar } from '../modules/blocks/data-blocks/form/FormItemSchemaToolbar';
import { useCreateFormBlockDecoratorProps } from '../modules/blocks/data-blocks/form/hooks/useCreateFormBlockDecoratorProps';
import { useCreateFormBlockProps } from '../modules/blocks/data-blocks/form/hooks/useCreateFormBlockProps';
import { useEditFormBlockDecoratorProps } from '../modules/blocks/data-blocks/form/hooks/useEditFormBlockDecoratorProps';
import { useEditFormBlockProps } from '../modules/blocks/data-blocks/form/hooks/useEditFormBlockProps';
import { TableColumnSchemaToolbar } from '../modules/blocks/data-blocks/table/TableColumnSchemaToolbar';
import { CollapseItemSchemaToolbar } from '../modules/blocks/filter-blocks/collapse/CollapseItemSchemaToolbar';
import { SchemaComponentOptions } from '../schema-component';
import { RecordLink, useParamsFromRecord, useSourceIdFromParentRecord, useSourceIdFromRecord } from './BlockProvider';
import { DetailsBlockProvider, useDetailsBlockProps } from './DetailsBlockProvider';
import { FilterFormBlockProvider } from './FilterFormBlockProvider';
import { FormBlockProvider, useFormBlockProps } from './FormBlockProvider';
import { FormFieldProvider, useFormFieldProps } from './FormFieldProvider';
import { TableBlockProvider } from './TableBlockProvider';
import { useTableBlockProps } from '../modules/blocks/data-blocks/table/hooks/useTableBlockProps';
import { TableFieldProvider, useTableFieldProps } from './TableFieldProvider';
import { TableSelectorProvider, useTableSelectorProps } from './TableSelectorProvider';
import * as bp from './hooks';
import { useTableBlockDecoratorProps } from '../modules/blocks/data-blocks/table/hooks/useTableBlockDecoratorProps';
import { useListBlockDecoratorProps } from '../modules/blocks/data-blocks/list/hooks/useListBlockDecoratorProps';
import { useTableSelectorDecoratorProps } from '../modules/blocks/data-blocks/table-selector/hooks/useTableSelectorDecoratorProps';
import { useCollapseBlockDecoratorProps } from '../modules/blocks/filter-blocks/collapse/hooks/useCollapseBlockDecoratorProps';
import { useFilterFormBlockProps } from '../modules/blocks/filter-blocks/form/hooks/useFilterFormBlockProps';
import { useFilterFormBlockDecoratorProps } from '../modules/blocks/filter-blocks/form/hooks/useFilterFormBlockDecoratorProps';
import { useGridCardBlockDecoratorProps } from '../modules/blocks/data-blocks/grid-card/hooks/useGridCardBlockDecoratorProps';
import { useDetailsProps } from '../modules/blocks/data-blocks/details-single/hooks/useDetailsProps';
import { useDetailsWithPaginationProps } from '../modules/blocks/data-blocks/details-multi/hooks/useDetailsWithPaginationProps';
import { useDetailsDecoratorProps } from '../modules/blocks/data-blocks/details-single/hooks/useDetailsDecoratorProps';
import { useDetailsWithPaginationDecoratorProps } from '../modules/blocks/data-blocks/details-multi/hooks/useDetailsWithPaginationDecoratorProps';

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
        useCreateFormBlockProps,
        useCreateFormBlockDecoratorProps,
        useEditFormBlockDecoratorProps,
        useEditFormBlockProps,
        useFormFieldProps,
        useDetailsBlockProps,
        useDetailsProps,
        useDetailsWithPaginationProps,
        useDetailsDecoratorProps,
        useDetailsWithPaginationDecoratorProps,
        useTableFieldProps,
        useTableBlockProps,
        useTableSelectorProps,
        useTableBlockDecoratorProps,
        useListBlockDecoratorProps,
        useTableSelectorDecoratorProps,
        useCollapseBlockDecoratorProps,
        useFilterFormBlockProps,
        useFilterFormBlockDecoratorProps,
        useGridCardBlockDecoratorProps,
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
      useCreateFormBlockProps,
      useCreateFormBlockDecoratorProps,
      useEditFormBlockDecoratorProps,
      useEditFormBlockProps,
      useFormFieldProps,
      useDetailsBlockProps,
      useDetailsProps,
      useDetailsWithPaginationProps,
      useDetailsDecoratorProps,
      useDetailsWithPaginationDecoratorProps,
      useTableFieldProps,
      useTableBlockProps,
      useTableSelectorProps,
      useTableBlockDecoratorProps,
      useListBlockDecoratorProps,
      useTableSelectorDecoratorProps,
      useCollapseBlockDecoratorProps,
      useFilterFormBlockProps,
      useFilterFormBlockDecoratorProps,
      useGridCardBlockDecoratorProps,
    });
  }
}
