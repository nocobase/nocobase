/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayItems } from '@formily/antd-v5';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import {
  ButtonEditor,
  SchemaSettings,
  useDesignable,
  useSchemaToolbar,
  SchemaSettingsLinkageRules,
  useDataBlockProps,
  useCollectionManager_deprecated,
} from '@nocobase/client';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShared } from './useShared';

export const exportActionSchemaSettings = new SchemaSettings({
  name: 'actionSettings:export',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'exportableFields',
      type: 'actionModal',
      useComponentProps() {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const [schema, setSchema] = useState<ISchema>();
        const { schema: pageSchema } = useShared();

        useEffect(() => {
          setSchema(pageSchema);
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [field.address, fieldSchema?.['x-action-settings']?.['exportSettings']]);

        return {
          title: t('Exportable fields'),
          schema: schema,
          initialValues: { exportSettings: fieldSchema?.['x-action-settings']?.exportSettings },
          components: { ArrayItems },
          onSubmit: ({ exportSettings }: any) => {
            fieldSchema['x-action-settings']['exportSettings'] = exportSettings
              ?.filter((fieldItem) => fieldItem?.dataIndex?.length)
              .map((item) => ({
                dataIndex: item.dataIndex.map((di) => di.name ?? di),
                title: item.title,
              }));

            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-action-settings': fieldSchema['x-action-settings'],
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { association } = useDataBlockProps() || {};
        const { getCollectionField } = useCollectionManager_deprecated();
        const associationField = getCollectionField(association);
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
          collectionName: associationField?.collectionName,
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      useComponentProps() {
        const { t } = useTranslation();

        return {
          removeParentsIfNoChildren: true,
          breakRemoveOn: (s) => {
            return s['x-component'] === 'Space' || s['x-component'].endsWith('ActionBar');
          },
          confirm: {
            title: t('Delete action'),
          },
        };
      },
    },
  ],
});
