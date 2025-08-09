/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { saveAs } from 'file-saver';
import { CollectionActionModel, Cascader } from '@nocobase/client';
import { css } from '@emotion/css';
import { useFields } from './useFields';
import { NAMESPACE } from './locale';

const initExportSettings = (fields) => {
  const exportSettings = fields
    ?.filter((f) => !f.isAssociationField() && f.options.interface)
    .map((f) => ({ dataIndex: [f.name] }));
  return exportSettings;
};
export class ExportActionModel extends CollectionActionModel {
  defaultProps: ButtonProps = {
    title: escapeT('Export'),
    type: 'default',
    icon: 'clouddownloadoutlined',
  };
}

ExportActionModel.define({
  title: escapeT('Export'),
});

ExportActionModel.registerFlow({
  key: 'exportSettings',
  on: 'click',
  steps: {
    confirm: {
      use: 'confirm',
      hideInSettings: true,
      defaultParams: {
        enable: true,
        title: escapeT('Export'),
        content: escapeT('Export warning', { ns: NAMESPACE, limit: 2000 }),
      },
    },
    export: {
      handler: async (ctx, params) => {
        const { exportSettings } = ctx.model.getProps();
        const currentBlock = ctx.model.context.blockModel;
        const { resource } = currentBlock;
        const { title, fields } = currentBlock.collection;
        exportSettings.forEach((es) => {
          const { uiSchema, interface: fieldInterface } = fields.get(es.dataIndex[0]) ?? {};
          // @ts-ignore
          es.enum = uiSchema?.enum?.map((e) => ({ value: e.value, label: e.label }));
          if (!es.enum && uiSchema?.type === 'boolean') {
            es.enum = [
              { value: true, label: ctx.t('Yes') },
              { value: false, label: ctx.t('No') },
            ];
          }
          es.defaultTitle = ctx.t(uiSchema?.title);
        });

        const data = await resource.runAction('export', {
          data: {
            columns: exportSettings,
          },
          responseType: 'blob',
          params: {
            title: ctx.t(title),
            appends: resource.getAppends(),
            sort: resource.getSort(),
            filter: resource.getFilter(),
          },
        });
        const blob = new Blob([data], { type: 'application/x-xls' });
        saveAs(blob, `${ctx.t(title)}.xlsx`);
      },
    },
  },
});

ExportActionModel.registerFlow({
  key: 'exportActionSetting',
  title: escapeT('Export settings', { ns: NAMESPACE }),
  steps: {
    exportableFields: {
      title: escapeT('Exportable fields'),
      uiSchema: (ctx) => {
        const currentBlock = ctx.model.context.blockModel;
        return {
          exportSettings: {
            type: 'array',
            'x-component': 'ArrayItems',
            'x-decorator': 'FormItem',
            items: {
              type: 'object',
              properties: {
                space: {
                  type: 'void',
                  'x-component': 'Space',
                  'x-component-props': {
                    className: css`
                      width: 100%;
                      & .ant-space-item:nth-child(2),
                      & .ant-space-item:nth-child(3) {
                        flex: 1;
                      }
                    `,
                  },
                  properties: {
                    sort: {
                      type: 'void',
                      'x-decorator': 'FormItem',
                      'x-component': 'ArrayItems.SortHandle',
                    },
                    dataIndex: {
                      type: 'array',
                      'x-decorator': 'FormItem',
                      'x-component': Cascader,
                      required: true,
                      'x-component-props': {
                        fieldNames: {
                          label: 'title',
                          value: 'name',
                          children: 'children',
                        },
                        // labelInValue: true,
                        changeOnSelect: false,
                      },
                      'x-use-component-props': () => {
                        // eslint-disable-next-line react-hooks/rules-of-hooks
                        const data = useFields(currentBlock.collection.name);
                        return {
                          options: data,
                        };
                      },
                    },
                    title: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-component-props': {
                        placeholder: '{{ t("Custom column title") }}',
                      },
                    },
                    remove: {
                      type: 'void',
                      'x-decorator': 'FormItem',
                      'x-component': 'ArrayItems.Remove',
                    },
                  },
                },
              },
            },
            properties: {
              add: {
                type: 'void',
                title: '{{ t("Add exportable field") }}',
                'x-component': 'ArrayItems.Addition',
                'x-component-props': {
                  className: css`
                    border-color: var(--colorSettings);
                    color: var(--colorSettings);
                    &.ant-btn-dashed:hover {
                      border-color: var(--colorSettings);
                      color: var(--colorSettings);
                    }
                  `,
                },
              },
            },
          },
        };
      },
      defaultParams: (ctx) => {
        const currentBlock = ctx.model.context.blockModel;
        const fields = currentBlock.collection.getFields();
        return {
          exportSettings: initExportSettings(fields),
        };
      },
      handler: (ctx, params) => {
        const { exportSettings } = params;
        const columns = exportSettings
          ?.filter((fieldItem) => fieldItem?.dataIndex?.length)
          .map((item) => ({
            dataIndex: item.dataIndex.map((di) => di.name ?? di),
            title: item.title,
          }));
        ctx.model.setProps('exportSettings', columns);
      },
    },
  },
});
