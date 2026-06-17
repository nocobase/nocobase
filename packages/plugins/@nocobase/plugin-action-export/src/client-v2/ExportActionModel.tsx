/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { css } from '@emotion/css';
import { saveAs } from 'file-saver';
import { Cascader } from 'antd';
import React from 'react';
import type { ButtonProps } from 'antd/es/button';
import { createLazyOptionFieldsCache } from './getOptionFields';
import { NAMESPACE } from './locale';
import { createExportFieldsOptionsSnapshot, normalizeExportFieldValue } from './exportFieldValue';

const exportFieldNames = {
  label: 'title',
  value: 'name',
  children: 'children',
};

const ExportFieldsCascader = (props) => {
  const { optionsCache, value, onChange, onDropdownVisibleChange, ...others } = props;
  const [cascaderOptions, setCascaderOptions] = React.useState(() => createExportFieldsOptionsSnapshot(optionsCache));
  const lastPreloadedValueRef = React.useRef<string | null>(null);
  const cascaderValue = React.useMemo(() => normalizeExportFieldValue(value) || undefined, [value]);

  const refreshOptions = React.useCallback(() => {
    setCascaderOptions(createExportFieldsOptionsSnapshot(optionsCache));
  }, [optionsCache]);

  React.useEffect(() => {
    refreshOptions();
  }, [refreshOptions]);

  const getValueKey = React.useCallback((path) => {
    if (!Array.isArray(path)) {
      return '';
    }
    return path.map((item) => item?.name ?? item).join('.');
  }, []);

  const loadData = React.useCallback(
    (selectedOptions) => {
      const targetOption = selectedOptions?.[selectedOptions.length - 1];
      if (!targetOption || targetOption.isLeaf || targetOption.children) {
        return;
      }

      targetOption.loading = true;
      optionsCache.loadChildren(targetOption);
      targetOption.loading = false;
      refreshOptions();
    },
    [optionsCache, refreshOptions],
  );

  const preloadSelectedPath = React.useCallback(() => {
    const valueKey = getValueKey(value);
    if (!valueKey || lastPreloadedValueRef.current === valueKey) {
      return;
    }
    lastPreloadedValueRef.current = valueKey;
    const changed = optionsCache.preloadPath(value);
    if (changed) {
      refreshOptions();
    }
  }, [getValueKey, optionsCache, refreshOptions, value]);

  const handleDropdownVisibleChange = React.useCallback(
    (open) => {
      if (open) {
        preloadSelectedPath();
      }
      onDropdownVisibleChange?.(open);
    },
    [onDropdownVisibleChange, preloadSelectedPath],
  );

  const handleChange = React.useCallback(
    (value) => {
      onChange?.(normalizeExportFieldValue(value));
    },
    [onChange],
  );

  const displayRender = React.useCallback(
    (labels, selectedOptions) => {
      const valueKey = getValueKey(value);
      const valueDepth = valueKey ? valueKey.split('.').length : 0;
      if (labels?.length && (!valueDepth || labels.length >= valueDepth)) {
        return labels.join(' / ');
      }
      if (valueKey) {
        return valueKey.replace(/\./g, ' / ');
      }
      return selectedOptions?.map((option) => option?.title || option?.name).join(' / ');
    },
    [getValueKey, value],
  );

  return (
    <Cascader
      {...others}
      value={cascaderValue}
      fieldNames={exportFieldNames}
      options={cascaderOptions}
      loadData={loadData}
      onChange={handleChange}
      onDropdownVisibleChange={handleDropdownVisibleChange}
      displayRender={displayRender}
    />
  );
};

const createExportFieldsCascaderCache = (rootFields, t) => {
  return createLazyOptionFieldsCache(rootFields, t);
};

const initExportSettings = (fields) => {
  const exportSettings = fields
    ?.filter((field) => !field.isAssociationField() && field.options.interface)
    .map((field) => ({ dataIndex: [field.name] }));
  return exportSettings;
};

export class ExportActionModel extends ActionModel {
  static scene: typeof ActionSceneEnum.collection = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    title: escapeT('Export'),
    type: 'default',
    icon: 'clouddownloadoutlined',
  };

  getAclActionName() {
    return 'export';
  }
}

ExportActionModel.define({
  label: escapeT('Export'),
  sort: 1030,
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
        const { title, fields, filterTargetKey } = currentBlock.collection;
        const selectedRows = resource.getSelectedRows();
        let filter;

        if (selectedRows.length > 0) {
          filter = { [filterTargetKey]: ctx.blockModel.collection.getFilterByTK(selectedRows) };
        } else {
          filter = resource.getFilter();
        }

        if (Array.isArray(filterTargetKey) && filterTargetKey.length > 1) {
          filter = { $or: ctx.blockModel.collection.getFilterByTK(selectedRows) };
        }

        exportSettings.forEach((exportSetting) => {
          const { uiSchema, interface: fieldInterface } = fields.get(exportSetting.dataIndex[0]) ?? {};
          void fieldInterface;
          exportSetting.enum = uiSchema?.enum?.map((item) => ({ value: item.value, label: item.label }));
          if (!exportSetting.enum && uiSchema?.type === 'boolean') {
            exportSetting.enum = [
              { value: true, label: ctx.t('Yes') },
              { value: false, label: ctx.t('No') },
            ];
          }
          exportSetting.defaultTitle = ctx.t(uiSchema?.title);
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
            filter,
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
        const exportFieldsCache = createExportFieldsCascaderCache(currentBlock.collection.getFields(), ctx.t);
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
                      'x-component': ExportFieldsCascader,
                      required: true,
                      'x-component-props': {
                        changeOnSelect: false,
                        optionsCache: exportFieldsCache,
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
            dataIndex: item.dataIndex.map((dataIndex) => dataIndex.name ?? dataIndex),
            title: item.title,
          }));
        ctx.model.setProps('exportSettings', columns);
      },
    },
  },
});
