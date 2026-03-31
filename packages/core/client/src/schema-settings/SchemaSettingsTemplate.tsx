/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormLayout } from '@formily/antd-v5';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../api-client/hooks/useAPIClient';
import { useCollectionManager_deprecated } from '../collection-manager/hooks/useCollectionManager_deprecated';
import { useGlobalTheme } from '../global-theme';
import { FormDialog } from '../schema-component/antd/form-dialog';
import { FormItem } from '../schema-component/antd/form-item/FormItem';
import { Input } from '../schema-component/antd/input/Input';
import { SchemaComponent } from '../schema-component/core/SchemaComponent';
import { useCompile } from '../schema-component/hooks/useCompile';
import { createDesignable } from '../schema-component/hooks/useDesignable';
import { useSchemaTemplateManager } from '../schema-templates';
import { useBlockTemplateContext } from '../schema-templates/BlockTemplateProvider';
import { SchemaSettingsItem, useSchemaSettings } from './SchemaSettings';

export function SchemaSettingsTemplate(props) {
  const { componentName, collectionName, resourceName, needRender, useTranslationHooks = useTranslation } = props;
  const { t } = useTranslationHooks();
  const { getCollection } = useCollectionManager_deprecated();
  const { dn, setVisible, template, fieldSchema } = useSchemaSettings();
  const compile = useCompile();
  const api = useAPIClient();
  const { dn: tdn } = useBlockTemplateContext();
  const { saveAsTemplate, copyTemplateSchema } = useSchemaTemplateManager();
  const { theme } = useGlobalTheme();

  if (!collectionName && !needRender) {
    return null;
  }
  if (template) {
    return (
      <SchemaSettingsItem
        title={t('Convert reference to duplicate')}
        onClick={async () => {
          const schema = await copyTemplateSchema(template);
          const removed = tdn.removeWithoutEmit();
          tdn.insertAfterEnd(schema, {
            async onSuccess() {
              await api.request({
                url: `/uiSchemas:remove/${removed['x-uid']}`,
              });
            },
          });
        }}
      >
        {t('Convert reference to duplicate')}
      </SchemaSettingsItem>
    );
  }
  return (
    <SchemaSettingsItem
      title={t('Save as reference template')}
      onClick={async () => {
        setVisible(false);
        const collection = collectionName && getCollection(collectionName);
        const values = await FormDialog(
          t('Save as reference template'),
          () => {
            return (
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  components={{ Input, FormItem }}
                  schema={{
                    type: 'object',
                    properties: {
                      name: {
                        title: t('Template name'),
                        required: true,
                        default: collection
                          ? `${compile(collection?.title || collection?.name)}_${t(componentName)}`
                          : t(componentName),
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                      },
                    },
                  }}
                />
              </FormLayout>
            );
          },
          theme,
        ).open({});
        const sdn = createDesignable({
          t,
          api,
          refresh: dn.refresh.bind(dn),
          current: fieldSchema.parent,
        });
        sdn.loadAPIClientEvents();
        const { key } = await saveAsTemplate({
          collectionName,
          resourceName,
          componentName,
          dataSourceKey: collection.dataSource,
          name: values.name,
          uid: fieldSchema['x-uid'],
        });
        sdn.removeWithoutEmit(fieldSchema);
        sdn.insertBeforeEnd({
          type: 'void',
          'x-component': 'BlockTemplate',
          'x-component-props': {
            templateId: key,
          },
        });
      }}
    >
      {t('Save as reference template')}
    </SchemaSettingsItem>
  );
}
