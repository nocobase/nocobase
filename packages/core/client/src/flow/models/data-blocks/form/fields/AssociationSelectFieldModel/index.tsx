/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Select } from 'antd';
import React from 'react';
import { omit } from 'lodash';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import { FormFieldModel } from '../FormFieldModel';
import { getUniqueKeyFromCollection } from '../../../../../../collection-manager/interfaces/utils';

function toValue(value, fieldNames, multiple, options = []) {
  if (!value) return multiple ? [] : undefined;
  const matchOption = (val) => options.find((opt) => opt[fieldNames.value] === val);

  if (multiple) {
    return value.map((v) => {
      const match = matchOption(v?.[fieldNames.value] ?? v);
      return match
        ? { label: match.label, value: match.value }
        : { label: v?.[fieldNames.label] ?? v, value: v?.[fieldNames.value] ?? v };
    });
  }

  const val = value?.[fieldNames.value] ?? value;
  const match = matchOption(val);
  return match ? { label: match.label, value: match.value } : { label: value?.[fieldNames.label] ?? val, value: val };
}

export const AssociationSelect = connect(
  (props) => {
    const { fieldNames, value, multiple } = props;
    return (
      <Select
        {...props}
        value={toValue(value, fieldNames, multiple, props.options)}
        showSearch
        labelInValue
        fieldNames
        mode={multiple ? 'multiple' : undefined}
        onChange={(value, option) => {
          const raw = Array.isArray(option)
            ? option.map((o) => omit(o, ['label', 'value']))
            : omit(option, ['label', 'value']);
          props.onChange(raw);
        }}
      />
    );
  },
  mapProps({
    dataSource: 'options',
  }),
  mapReadPretty((props) => {
    return props.value;
  }),
);

export class AssociationSelectFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy'];
  dataSource;

  set onPopupScroll(fn) {
    this.field.setComponentProps({ onPopupScroll: fn });
  }
  set onDropdownVisibleChange(fn) {
    this.field.setComponentProps({ onDropdownVisibleChange: fn });
  }
  set onSearch(fn) {
    this.field.setComponentProps({ onSearch: fn });
  }
  setDataSource(dataSource) {
    this.field.dataSource = dataSource;
  }
  getDataSource() {
    return this.field.dataSource;
  }
  async transformDataSource(options) {
    const { fieldNames } = this.field?.componentProps || {};
    const collectionManager = this.collectionField.collection.collectionManager;
    const target = this.collectionField?.options?.target;
    const targetCollection = collectionManager.getCollection(target);
    const targetLabelField = targetCollection.getField(fieldNames.label);
    const fieldClasses = Array.from(this.flowEngine.filterModelClassByParent('TableFieldModel').values()).sort(
      (a, b) => (a.meta?.sort || 0) - (b.meta?.sort || 0),
    );

    const fieldClass = fieldClasses.find(
      (cls) => cls.supportedFieldInterfaces?.includes(targetLabelField?.options?.interface),
    );

    const model = this.flowEngine.createModel({
      use: fieldClass?.name || 'TableFieldModel',
    });
    await model.applyAutoFlows({ collectionField: targetLabelField, fieldPath: fieldNames.label });
    return options.map((v, index) => {
      model.setSharedContext({
        ...this.getSharedContext(),
        collectionName: target,
        fieldPath: fieldNames.label,
        value: v[fieldNames.label],
        record: v,
        index: index,
      });
      return {
        ...v,
        value: v[fieldNames.value],
        label: <FlowEngineProvider engine={this.flowEngine}>{model.render()}</FlowEngineProvider>,
      };
    });
  }
  get component() {
    return [AssociationSelect];
  }
}

AssociationSelectFieldModel.registerFlow({
  key: 'init',
  auto: true,
  sort: 100,
  steps: {
    step1: {
      handler(ctx, params) {
        let initialized = false;
        ctx.model.onDropdownVisibleChange = (open) => {
          if (open && !initialized) {
            initialized = true;

            ctx.model.dispatchEvent('dropdownOpen', {
              apiClient: ctx.app.apiClient,
              field: ctx.model.field,
              form: ctx.model.form,
            });
          }
        };
        ctx.model.onPopupScroll = (e) => {
          ctx.model.dispatchEvent('popupScroll', {
            event: e,
            apiClient: ctx.app.apiClient,
            field: ctx.model.field,
          });
        };
        ctx.model.onSearch = (searchText) => {
          ctx.model.dispatchEvent('search', {
            searchText,
            apiClient: ctx.app.apiClient,
            field: ctx.model.field,
          });
        };
      },
    },
  },
});

AssociationSelectFieldModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'dropdownOpen',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        const { target } = ctx.model.collectionField.options;
        const apiClient = ctx.app.apiClient;
        const response = await apiClient.request({
          url: `/${target}:list`,
          params: {
            pageSize: 20,
          },
        });
        const { data } = response.data;
        const data1 = await ctx.model.transformDataSource(data);
        ctx.model.setDataSource(data1);
      },
    },
  },
});

const paginationState = {
  page: 1,
  pageSize: 20,
  loading: false,
  hasMore: true,
};

AssociationSelectFieldModel.registerFlow({
  key: 'event2',
  on: {
    eventName: 'popupScroll',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        if (paginationState.loading || !paginationState.hasMore) {
          return;
        }
        paginationState.loading = true;

        try {
          const { target } = ctx.model.collectionField.options;
          const apiClient = ctx.app.apiClient;

          const response = await apiClient.request({
            url: `/${target}:list`,
            params: {
              page: paginationState.page,
              pageSize: paginationState.pageSize,
            },
          });

          const { data } = response.data;

          const currentDataSource = ctx.model.getDataSource() || [];
          ctx.model.setDataSource([...currentDataSource, ...data]);

          if (data.length < paginationState.pageSize) {
            paginationState.hasMore = false;
          } else {
            paginationState.page++;
          }
        } catch (error) {
          console.error('滚动分页请求失败:', error);
        } finally {
          paginationState.loading = false;
        }
      },
    },
  },
});

AssociationSelectFieldModel.registerFlow({
  key: 'event3',
  on: {
    eventName: 'search',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        try {
          const collectionField = ctx.model.collectionField;
          const collectionManager = collectionField.collection.collectionManager;
          const targetCollection = collectionManager.getCollection(collectionField.options.target);

          const labelFieldName = ctx.model.field.componentProps.fieldNames.label;
          const targetLabelField = targetCollection.getField(labelFieldName);

          const targetInterface = ctx.app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(
            targetLabelField.options.interface,
          );
          const operator = targetInterface?.filterable?.operators?.[0]?.value || '$includes';

          const searchText = ctx.extra.searchText?.trim();

          const apiClient = ctx.app.apiClient;
          const response = await apiClient.request({
            url: `/${collectionField.options.target}:list`,
            params: {
              filter: {
                [labelFieldName]: {
                  [operator]: searchText,
                },
              },
            },
          });

          const { data } = response.data;
          ctx.model.setDataSource(data);
        } catch (error) {
          console.error('AssociationSelectField search flow error:', error);
          // 出错时也可以选择清空数据源或者显示错误提示
          ctx.model.setDataSource([]);
        }
      },
    },
  },
});

// 标题字段
AssociationSelectFieldModel.registerFlow({
  key: 'fieldNames',
  auto: true,
  sort: 200,
  title: 'Specific properties',
  steps: {
    fieldNames: {
      title: 'Title field',
      uiSchema: {
        label: {
          'x-component': 'Select',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: (ctx) => {
        const { target } = ctx.model.collectionField.options;
        const collectionManager = ctx.model.collectionField.collection.collectionManager;
        const targetCollection = collectionManager.getCollection(target);
        const filterKey = getUniqueKeyFromCollection(targetCollection.options as any);
        return {
          label: ctx.model.props.fieldNames?.label || targetCollection.options.titleField || filterKey,
        };
      },
      handler(ctx, params) {
        const { target } = ctx.model.collectionField.options;
        const collectionManager = ctx.model.collectionField.collection.collectionManager;
        ctx.model.setStepParams;
        const targetCollection = collectionManager.getCollection(target);
        const filterKey = getUniqueKeyFromCollection(targetCollection.options as any);
        const newFieldNames = {
          value: filterKey,
          label: params.label || targetCollection.options.titleField || filterKey,
        };
        ctx.model.setComponentProps({ fieldNames: newFieldNames });
      },
    },
  },
});
