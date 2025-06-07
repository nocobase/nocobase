/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import {
  ActionContext,
  SchemaComponent,
  useCompile,
  usePlugin,
  useRecord,
  useActionContext,
  useResourceActionContext,
  useResourceContext,
  useDataSourceManager,
  useAPIClient,
} from '@nocobase/client';
import _ from 'lodash';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useField } from '@formily/react';
import PluginDatabaseConnectionsClient from '../';
import { NAMESPACE } from '../locale';
import { addDatasourceCollections, useLoadCollections } from '../hooks';

export const EditDatabaseConnectionAction = () => {
  const record = useRecord();
  const [schema, setSchema] = useState({});
  const plugin = usePlugin(PluginDatabaseConnectionsClient);
  const compile = useCompile();
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const dm = useDataSourceManager();
  const loadCollections = useLoadCollections();
  const api = useAPIClient();

  const useUpdateAction = () => {
    const field = useField();
    const form = useForm();
    const ctx = useActionContext();
    const { refresh } = useResourceActionContext();
    const { resource } = useResourceContext();
    const { key: filterByTk } = useRecord();
    return {
      async run() {
        await form.submit();
        field.data = field.data || {};
        field.data.loading = true;
        try {
          const toBeAddedCollections = form.values.collections || [];
          if (!form.values.addAllCollections) {
            await addDatasourceCollections(api, filterByTk, toBeAddedCollections);
          }
          delete form.values.collections;
          await resource.update({ filterByTk, values: form.values });
          ctx.setVisible(false);
          dm.getDataSource(filterByTk).setOptions(form.values);
          dm.getDataSource(filterByTk).reload();
          await form.reset();
          refresh();
        } catch (e) {
          console.log(e);
        } finally {
          field.data.loading = false;
        }
      },
    };
  };
  return (
    <div>
      <ActionContext.Provider value={{ visible, setVisible }}>
        {record.key !== 'main' && (
          <a
            onClick={() => {
              setVisible(true);
              const type = plugin.types.get(record.type);
              setSchema({
                type: 'object',
                properties: {
                  [uid()]: {
                    type: 'void',
                    'x-component': 'Action.Drawer',
                    'x-decorator': 'Form',
                    'x-decorator-props': {
                      initialValue: record,
                    },
                    'x-component-props': {
                      width: 650,
                    },
                    title: compile("{{t('Edit')}}") + ' - ' + compile(record.displayName),
                    properties: {
                      body: {
                        type: 'void',
                        'x-component': type.DataSourceSettingsForm.bind(null, { loadCollections, from: 'edit' }),
                      },
                      footer: {
                        type: 'void',
                        'x-component': 'Action.Drawer.Footer',
                        properties: {
                          cancel: {
                            title: '{{t("Cancel")}}',
                            'x-component': 'Action',
                            'x-component-props': {
                              useAction: '{{ cm.useCancelAction }}',
                            },
                          },
                          testConnectiion: {
                            title: `{{ t("Test Connection",{ ns: "${NAMESPACE}" }) }}`,
                            'x-component': 'Action',
                            'x-component-props': {
                              useAction: '{{ useTestConnectionAction }}',
                            },
                            'x-hidden': type?.disableTestConnection,
                          },
                          submit: {
                            title: '{{t("Submit")}}',
                            'x-component': 'Action',
                            'x-component-props': {
                              type: 'primary',
                              useAction: '{{ useUpdateAction }}',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              });
            }}
          >
            {t('Edit')}
          </a>
        )}
        <SchemaComponent scope={{ createOnly: true, useUpdateAction, loadCollections }} schema={schema} />
      </ActionContext.Provider>
    </div>
  );
};
