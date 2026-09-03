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
import { Cascader, Spin, type CascaderProps } from 'antd';
import React from 'react';
import type { ButtonProps } from 'antd/es/button';
import type { ExportFieldOption } from './buildExportFieldOptions';
import { createLazyOptionFieldsCache } from './getOptionFields';
import { NAMESPACE } from './locale';
import { createExportFieldsOptionsSnapshot, normalizeExportFieldValue } from './exportFieldValue';

const exportFieldNames = {
  label: 'title',
  value: 'name',
  children: 'children',
};

const SEARCH_DEBOUNCE_DELAY = 150;

type ExportFieldsCascaderProps = Omit<
  CascaderProps<ExportFieldOption, 'name', false>,
  'fieldNames' | 'loadData' | 'onChange' | 'options' | 'showSearch' | 'value'
> & {
  optionsCache: ReturnType<typeof createLazyOptionFieldsCache>;
  value?: unknown[];
  onChange?: (value: string[] | null, selectedOptions: ExportFieldOption[]) => void;
};

export const ExportFieldsCascader = (props: ExportFieldsCascaderProps) => {
  const { optionsCache, value, onChange, onDropdownVisibleChange, onSearch, notFoundContent, ...others } = props;
  const [, setOptionsVersion] = React.useState(0);
  const [searchOptions, setSearchOptions] = React.useState<ExportFieldOption[]>([]);
  const [searchStatus, setSearchStatus] = React.useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const searchAbortControllerRef = React.useRef<AbortController>();
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout>>();
  const searchValueRef = React.useRef('');
  const optionsCacheRef = React.useRef(optionsCache);
  const mountedRef = React.useRef(false);
  const cascaderValue = React.useMemo(() => normalizeExportFieldValue(value), [value]);

  const refreshOptions = React.useCallback(() => {
    setOptionsVersion((version) => version + 1);
  }, []);

  React.useEffect(() => {
    optionsCacheRef.current = optionsCache;
    searchValueRef.current = '';
    searchAbortControllerRef.current?.abort();
    searchAbortControllerRef.current = undefined;
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = undefined;
    }
    setSearchOptions([]);
    setSearchStatus('idle');
  }, [optionsCache]);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      searchAbortControllerRef.current?.abort();
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const getValueKey = React.useCallback((path) => {
    if (!Array.isArray(path)) {
      return '';
    }
    return path.map((item) => item?.name ?? item).join('.');
  }, []);

  optionsCache.preloadPath(cascaderValue);
  const cascaderOptions = createExportFieldsOptionsSnapshot(optionsCache);

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

  const handleDropdownVisibleChange = React.useCallback(
    (open) => {
      if (open) {
        refreshOptions();
      }
      onDropdownVisibleChange?.(open);
    },
    [onDropdownVisibleChange, refreshOptions],
  );

  const handleChange = React.useCallback(
    (nextValue: string[], selectedOptions: ExportFieldOption[]) => {
      onChange?.(normalizeExportFieldValue(nextValue), selectedOptions);
    },
    [onChange],
  );

  const handleSearch = React.useCallback(
    (searchValue) => {
      searchValueRef.current = searchValue;
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = undefined;
      }
      searchAbortControllerRef.current?.abort();
      searchAbortControllerRef.current = undefined;

      if (!searchValue.trim()) {
        setSearchOptions([]);
        setSearchStatus('idle');
      } else {
        setSearchOptions([]);
        setSearchStatus('loading');
        searchTimerRef.current = setTimeout(async () => {
          const activeOptionsCache = optionsCache;
          const activeSearchValue = searchValue;
          const abortController = new AbortController();
          searchAbortControllerRef.current = abortController;
          searchTimerRef.current = undefined;
          try {
            const matchedOptions = await activeOptionsCache.searchOptionsAsync(activeSearchValue, {
              signal: abortController.signal,
            });
            if (
              abortController.signal.aborted ||
              !mountedRef.current ||
              optionsCacheRef.current !== activeOptionsCache ||
              searchValueRef.current !== activeSearchValue
            ) {
              return;
            }
            setSearchOptions(matchedOptions);
            setSearchStatus('ready');
          } catch {
            if (
              !abortController.signal.aborted &&
              mountedRef.current &&
              optionsCacheRef.current === activeOptionsCache &&
              searchValueRef.current === activeSearchValue
            ) {
              setSearchOptions([]);
              setSearchStatus('error');
            }
          } finally {
            if (searchAbortControllerRef.current === abortController) {
              searchAbortControllerRef.current = undefined;
            }
          }
        }, SEARCH_DEBOUNCE_DELAY);
      }
      onSearch?.(searchValue);
    },
    [onSearch, optionsCache],
  );

  const searchIsActive = Boolean(searchValueRef.current.trim());
  // ArrayItems can reuse this component after a value change. Remount Cascader so rc-cascader cannot retain
  // path entities created from the previous lazy-loaded relation path.
  const valueKey = getValueKey(cascaderValue);

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
      key={valueKey}
      {...others}
      value={cascaderValue || undefined}
      fieldNames={exportFieldNames}
      options={searchIsActive ? searchOptions : cascaderOptions}
      loadData={loadData}
      notFoundContent={searchStatus === 'loading' ? <Spin size="small" /> : notFoundContent}
      onChange={handleChange}
      onDropdownVisibleChange={handleDropdownVisibleChange}
      onSearch={handleSearch}
      showSearch
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
  static scene = ActionSceneEnum.collection;

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
            filter: JSON.stringify(filter),
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
