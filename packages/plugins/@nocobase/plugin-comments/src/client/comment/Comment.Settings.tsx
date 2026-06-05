/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import {
  SchemaSettings,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsDataScope,
  removeNullCondition,
  useCollection_deprecated,
  useDesignable,
  useFormBlockContext,
  SchemaSettingsLinkageRules,
  LinkageRuleCategory,
  useBlockRequestContext,
} from '@nocobase/client';
import { useCommentBlockDescoratorContext } from '../provider/useCommentBlockDecoratorContext';
import { useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useTranslation } from '../locale';

export const commentBlockSettings = new SchemaSettings({
  name: 'blockSettings:comment',
  items: [
    {
      name: 'title',
      Component: SchemaSettingsBlockTitleItem,
    },
    {
      name: 'blockLinkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { t } = useTranslation();
        return {
          title: t('Block Linkage rules', { ns: 'client' }),
          category: LinkageRuleCategory.block,
        };
      },
    },
    {
      name: 'SetTheDataScope',
      Component: SchemaSettingsDataScope,
      useComponentProps() {
        const { name } = useCollection_deprecated();
        const fieldSchema = useFieldSchema();
        const { form } = useFormBlockContext();
        const field = useField();
        const { dn } = useDesignable();

        return {
          collectionName: name,
          defaultFilter: fieldSchema?.['x-decorator-props']?.params?.filter || {},
          form: form,
          onSubmit: ({ filter }) => {
            filter = removeNullCondition(filter);
            _.set(fieldSchema, 'x-decorator-props.params.filter', filter);
            field.decoratorProps.params = { ...fieldSchema['x-decorator-props'].params, page: 1 };
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
      name: 'RecordsPerPage',
      type: 'select',
      useComponentProps() {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { service } = useBlockRequestContext();
        const { t } = useTranslation();
        const { dn } = useDesignable();

        return {
          title: t('Records per page', { ns: 'client' }),
          value: field.decoratorProps?.params?.pageSize || 20,
          options: [
            { label: '5', value: 5 },
            { label: '10', value: 10 },
            { label: '20', value: 20 },
            { label: '50', value: 50 },
            { label: '100', value: 100 },
            { label: '200', value: 200 },
          ],
          onChange: (pageSize) => {
            const params = field.decoratorProps.params || {};
            params.pageSize = pageSize;
            field.decoratorProps.params = params;
            fieldSchema['x-decorator-props']['params'] = params;
            service.run({ ...service.params?.[0], pageSize, page: 1 });
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
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'EnableCreate',
      type: 'switch',
      useComponentProps() {
        const { setCreateAble, createAble } = useCommentBlockDescoratorContext();
        const { t } = useTranslation();
        return {
          title: t('Enable Create'),
          checked: createAble,
          onChange: setCreateAble,
        };
      },
    },
    // {
    //   name: 'EnableEdit',
    //   type: 'switch',
    //   useComponentProps() {
    //     const { setEditAble, editAble } = useCommentBlockDescoratorContext();
    //     return {
    //       title: 'Enable Edit',
    //       checked: editAble,
    //       onChange: setEditAble,
    //     };
    //   },
    // },
    // {
    //   name: 'EnableDelete',
    //   type: 'switch',
    //   useComponentProps() {
    //     const { setDeleteAble, deleteAble } = useCommentBlockDescoratorContext();
    //     return {
    //       title: 'Enable Delete',
    //       checked: deleteAble,
    //       onChange: setDeleteAble,
    //     };
    //   },
    // },
    // {
    //   name: 'divider2',
    //   type: 'divider',
    // },
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
