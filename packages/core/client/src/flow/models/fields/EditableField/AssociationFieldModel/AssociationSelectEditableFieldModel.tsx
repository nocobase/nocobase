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
import { useStepSettingContext, FlowModelRenderer, useFlowEngine, useFlowModel, reactive } from '@nocobase/flow-engine';
import { useCompile } from '../../../../../schema-component';
import { getUniqueKeyFromCollection } from '../../../../../collection-manager/interfaces/utils';
import { AssociationFieldEditableFieldModel } from './AssociationFieldEditableFieldModel';
import { isTitleField } from '../../../../../data-source';

function toValue(record: any | any[], fieldNames, multiple = false) {
  if (!record) return multiple ? [] : undefined;

  const { label: labelKey, value: valueKey } = fieldNames;

  const convert = (item: any) => {
    if (typeof item !== 'object' || item === null) return undefined;
    return {
      label: <LabelByField option={record} fieldNames={fieldNames} />,
      value: item[valueKey],
    };
  };

  if (multiple) {
    if (!Array.isArray(record)) return [];
    return record.map(convert).filter(Boolean);
  }

  return convert(record);
}
const modelCache = new Map<string, any>();

function LabelByField(props) {
  const { option, fieldNames } = props;
  const cacheKey = option[fieldNames.value] + option[fieldNames.label];
  const currentModel: any = useFlowModel();
  const flowEngine = useFlowEngine();
  if (modelCache.has(cacheKey)) {
    return <FlowModelRenderer model={modelCache.get(cacheKey)} />;
  }
  const collectionManager = currentModel.collectionField.collection.collectionManager;
  const target = currentModel.collectionField?.options?.target;
  const targetCollection = collectionManager.getCollection(target);
  const targetLabelField = targetCollection.getField(fieldNames.label);
  const fieldClasses = Array.from(flowEngine.filterModelClassByParent('ReadPrettyFieldModel').values()).sort(
    (a, b) => (a.meta?.sort || 0) - (b.meta?.sort || 0),
  );

  const fieldClass = fieldClasses.find(
    (cls) => cls.supportedFieldInterfaces?.includes(targetLabelField?.options?.interface),
  );
  const model = flowEngine.createModel({
    use: fieldClass?.name || 'ReadPrettyFieldModel',
    stepParams: {
      default: {
        step1: {
          dataSourceKey: currentModel.collectionField.collection.dataSourceKey,
          collectionName: target,
          fieldPath: fieldNames.label,
        },
      },
    },
  });
  model.setSharedContext({
    ...currentModel.getSharedContext(),
    value: option[fieldNames.label],
  });

  model.setParent(currentModel.parent);
  modelCache.set(cacheKey, model);

  return (
    <span key={option[fieldNames.value]}>
      <FlowModelRenderer model={model} uid={option[fieldNames.value]} />
    </span>
  );
}

function LazySelect(props) {
  const { fieldNames, value, multiple } = props;
  return (
    <Select
      showSearch
      labelInValue
      {...props}
      value={toValue(value, fieldNames, multiple)}
      mode={multiple && 'multiple'}
      onChange={(value, option) => {
        props.onChange(option);
      }}
      optionRender={({ data }) => {
        return <LabelByField option={data} fieldNames={fieldNames} />;
      }}
    />
  );
}

const AssociationSelect = connect(
  (props: any) => {
    return <LazySelect {...props} />;
  },
  mapProps(
    {
      dataSource: 'options',
    },
    (props, field) => {
      return {
        ...props,
      };
    },
  ),
  mapReadPretty((props) => {
    return props.value;
  }),
);

export class AssociationSelectEditableFieldModel extends AssociationFieldEditableFieldModel {
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
  get component() {
    return [AssociationSelect, {}];
  }
}

AssociationSelectEditableFieldModel.registerFlow({
  key: 'associationSelectInit',
  auto: true,
  sort: 200,
  steps: {
    bindEvent: {
      handler(ctx, params) {
        ctx.model.onDropdownVisibleChange = (open) => {
          if (open) {
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

const paginationState = {
  page: 1,
  pageSize: 40,
  loading: false,
  hasMore: true,
};

AssociationSelectEditableFieldModel.registerFlow({
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
            pageSize: paginationState.pageSize,
            page: 1,
          },
        });
        const { data } = response.data;
        ctx.model.setDataSource(data);
        if (data.length < paginationState.pageSize) {
          paginationState.hasMore = false;
        } else {
          paginationState.hasMore = true;
          paginationState.page++;
        }
      },
    },
  },
});

AssociationSelectEditableFieldModel.registerFlow({
  key: 'event2',
  on: {
    eventName: 'popupScroll',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        const event = ctx.extra?.event;
        const { scrollTop, scrollHeight, clientHeight } = event.target;
        // 只在接近底部时才触发加载
        if (scrollTop + clientHeight < scrollHeight - 20) {
          return;
        }
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
            paginationState.page = 1;
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

AssociationSelectEditableFieldModel.registerFlow({
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

const SelectOptions = (props) => {
  const {
    model: { collectionField },
    app,
  } = useStepSettingContext();
  const compile = useCompile();
  const collectionManager = collectionField?.collection?.collectionManager;
  const dataSourceManager = app.dataSourceManager;
  const target = collectionField?.options?.target;
  if (!collectionManager || !target) return;
  const targetCollection = collectionManager.getCollection(target);
  const targetFields = targetCollection?.getFields?.() ?? [];
  const options = targetFields
    .filter((field) => isTitleField(dataSourceManager, field.options))
    .map((field) => ({
      value: field.name,
      label: compile(field.options.uiSchema?.title) || field.name,
    }));
  return <Select {...props} options={options} />;
};

AssociationSelectEditableFieldModel.registerFlow({
  key: 'fieldNames',
  auto: true,
  sort: 200,
  title: 'Specific properties',
  steps: {
    fieldNames: {
      title: 'Title field',
      uiSchema: {
        label: {
          'x-component': SelectOptions,
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
