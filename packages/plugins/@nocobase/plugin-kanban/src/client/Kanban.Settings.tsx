/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import {
  removeNullCondition,
  SchemaSettings,
  SchemaSettingsBlockHeightItem,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsDataScope,
  SchemaSettingsTemplate,
  useBlockTemplateContext,
  useCollection,
  useCollection_deprecated,
  useDesignable,
  useFormBlockContext,
  SchemaSettingsLayoutItem,
  SchemaSettingsLinkageRules,
  LinkageRuleCategory,
} from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import { useKanbanBlockContext } from './KanbanBlockProvider';

export const kanbanSettings = new SchemaSettings({
  name: 'blockSettings:kanban',
  items: [
    {
      name: 'title',
      Component: SchemaSettingsBlockTitleItem,
    },
    {
      name: 'setTheBlockHeight',
      Component: SchemaSettingsBlockHeightItem,
    },
    {
      name: 'blockLinkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection_deprecated();
        const { t } = useTranslation();
        return {
          collectionName: name,
          title: t('Block Linkage rules'),
          category: LinkageRuleCategory.block,
        };
      },
    },
    {
      name: 'dataScope',
      Component: SchemaSettingsDataScope,
      useComponentProps() {
        const { name } = useCollection_deprecated();
        const fieldSchema = useFieldSchema();
        const { form } = useFormBlockContext();
        const field = useField();
        const { service } = useKanbanBlockContext();
        const { dn } = useDesignable();
        return {
          collectionName: name,
          defaultFilter: fieldSchema?.['x-decorator-props']?.params?.filter || {},
          form,
          onSubmit: ({ filter }) => {
            filter = removeNullCondition(filter);
            const params = field.decoratorProps.params || {};
            params.filter = filter;
            field.decoratorProps.params = params;
            fieldSchema['x-decorator-props']['params'] = params;
            service.run({ ...service.params?.[0], filter });
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-decorator-props': fieldSchema['x-decorator-props'],
              },
            });
          },
        };
      },
    },
    {
      name: 'template',
      Component: SchemaSettingsTemplate,
      useComponentProps() {
        const { name } = useCollection();
        const { componentNamePrefix } = useBlockTemplateContext();
        return {
          componentName: `${componentNamePrefix}Kanban`,
          collectionName: name,
        };
      },
    },
    {
      name: 'allowDragAndDrop',
      type: 'switch',
      useComponentProps: () => {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        return {
          title: t('Enable drag and drop sorting'),
          checked: field.componentProps?.dragSort !== false,
          onChange: async (dragSort) => {
            field.componentProps = field.componentProps || {};
            field.componentProps.dragSort = dragSort;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props'].dragSort = dragSort;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-component-props': fieldSchema['x-component-props'],
              },
            });
          },
        };
      },
    },
    {
      name: 'setBlockLayout',
      Component: SchemaSettingsLayoutItem,
    },
    {
      name: 'divider',
      type: 'divider',
    },

    {
      name: 'remove',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: {
          'x-component': 'Grid',
        },
      },
    },
  ],
});
