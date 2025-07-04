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
import { castArray } from 'lodash';
import { useFlowModel, FlowModel, MultiRecordResource } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { AssociationFieldEditableFieldModel } from './AssociationFieldEditableFieldModel';

function toValue(record: any | any[], fieldNames, multiple = false) {
  if (!record) return multiple ? [] : undefined;

  const { label: labelKey, value: valueKey } = fieldNames;

  const convert = (item: any) => {
    if (typeof item !== 'object' || item === null) return undefined;
    return {
      label: <LabelByField option={item} fieldNames={fieldNames} />,
      value: item[valueKey],
    };
  };

  if (multiple) {
    if (!Array.isArray(record)) return [];
    return record.map(convert).filter(Boolean);
  }

  return convert(record);
}

function LabelByField(props) {
  const { option, fieldNames } = props;
  const currentModel = useFlowModel();
  const field = currentModel.subModels.field as FlowModel;
  const key = option[fieldNames.value];
  const fieldModel = field.createFork({}, key);
  fieldModel.setSharedContext({
    value: option?.[fieldNames.label],
    currentRecord: option,
  });

  return <span key={option[fieldNames.value]}>{option[fieldNames.label] ? fieldModel.render() : tval('N/A')}</span>;
}

function LazySelect(props) {
  const { fieldNames, value, multiple, options, ...others } = props;
  const realOptions =
    options && options.length ? options : multiple ? (Array.isArray(value) ? value : []) : value ? [value] : [];
  return (
    <Select
      {...others}
      allowClear
      showSearch
      filterOption={false}
      labelInValue
      fieldNames={fieldNames}
      options={realOptions}
      value={toValue(value, fieldNames, multiple)}
      mode={multiple ? 'multiple' : undefined}
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
    const currentModel: any = useFlowModel();

    const { fieldNames, value } = props;
    if (!value) {
      return;
    }
    const field = currentModel.subModels.field as FlowModel;
    const key = value?.[fieldNames.value];
    const fieldModel = field.createFork({}, key);
    fieldModel.setSharedContext({
      value: value?.[fieldNames.label],
      currentRecord: value,
    });
    const arrayValue = castArray(value);

    return (
      <>
        {arrayValue.map((v, index) => {
          const key = `${index}`;
          const fieldModel = field.createFork({}, key);
          fieldModel.setSharedContext({
            index,
            value: v?.[fieldNames.label],
            currentRecord: v,
          });

          const content = v?.[fieldNames.label] ? fieldModel.render() : tval('N/A');
          return (
            <React.Fragment key={index}>
              {index > 0 && ', '}
              {content}
            </React.Fragment>
          );
        })}
      </>
    );
  }),
);

export class AssociationSelectEditableFieldModel extends AssociationFieldEditableFieldModel {
  static supportedFieldInterfaces = ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy'];
  dataSource;
  declare resource: MultiRecordResource;

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

const paginationState = {
  page: 1,
  pageSize: 40,
  loading: false,
  hasMore: true,
};

// 事件绑定
AssociationSelectEditableFieldModel.registerFlow({
  key: 'associationSelectInit',
  auto: true,
  sort: 300,
  steps: {
    bindEvent: {
      handler(ctx, params) {
        const labelFieldName = ctx.model.field.componentProps.fieldNames.label;

        ctx.model.onDropdownVisibleChange = (open) => {
          if (open) {
            ctx.model.dispatchEvent('dropdownOpen', {
              apiClient: ctx.app.apiClient,
              field: ctx.model.field,
              form: ctx.model.form,
            });
          } else {
            ctx.model.resource.removeFilterGroup(labelFieldName);
            paginationState.page = 1;
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

//点击打开下拉时加载数据
AssociationSelectEditableFieldModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'dropdownOpen',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        const labelFieldValue = ctx.model.field.componentProps.fieldNames.value;
        const resource = ctx.model.resource;
        const dataSource = ctx.model.field.dataSource;
        resource.setPage(1);
        await resource.refresh();
        const { count } = resource.getMeta();
        const data = resource.getData();
        //已经全部加载
        if (dataSource && count === dataSource.length && data[0][labelFieldValue] === dataSource[0][labelFieldValue]) {
          return;
        }
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

//鼠标滚动后分页加载数据
AssociationSelectEditableFieldModel.registerFlow({
  key: 'event2',
  on: {
    eventName: 'popupScroll',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        const event = ctx.runtimeArgs?.event;
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
          const resource = ctx.model.resource;
          resource.setPage(paginationState.page);
          await resource.refresh();
          const data = resource.getData();
          const currentDataSource = ctx.model.getDataSource() || [];
          ctx.model.setDataSource([...currentDataSource, ...data]);
          if (data.length < paginationState.pageSize) {
            paginationState.hasMore = false;
            paginationState.page = 1;
          } else {
            paginationState.page++;
          }
        } catch (error) {
          console.error('Scroll pagination request failed:', error);
        } finally {
          paginationState.loading = false;
        }
      },
    },
  },
});
// 模糊搜索
AssociationSelectEditableFieldModel.registerFlow({
  key: 'event3',
  on: {
    eventName: 'search',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        try {
          const targetCollection = ctx.model.collectionField.targetCollection;
          const labelFieldName = ctx.model.field.componentProps.fieldNames.label;
          const targetLabelField = targetCollection.getField(labelFieldName);

          const targetInterface = ctx.app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(
            targetLabelField.options.interface,
          );
          const operator = targetInterface?.filterable?.operators?.[0]?.value || '$includes';

          const searchText = ctx.runtimeArgs.searchText?.trim();

          const resource = ctx.model.resource;
          const key = `${labelFieldName}.${operator}`;
          if (searchText === '') {
            resource.removeFilterGroup(labelFieldName);
          } else {
            resource.setPage(1);
            resource.addFilterGroup(labelFieldName, {
              [key]: searchText,
            });
          }
          await resource.refresh();
          const data = resource.getData();
          ctx.model.setDataSource(data);
          if (data.length < paginationState.pageSize) {
            paginationState.hasMore = false;
          } else {
            paginationState.hasMore = true;
            paginationState.page++;
          }
        } catch (error) {
          console.error('AssociationSelectField search flow error:', error);
          // 出错时也可以选择清空数据源或者显示错误提示
          ctx.model.setDataSource([]);
        }
      },
    },
  },
});

//专有配置项
AssociationSelectEditableFieldModel.registerFlow({
  key: 'associationSelectSpecific',
  title: tval('Specific properties'),
  auto: true,
  sort: 200,
  steps: {
    default: {
      handler(ctx) {
        const resource = new MultiRecordResource();
        const { target, dataSourceKey } = ctx.model.collectionField;
        resource.setDataSourceKey(dataSourceKey);
        resource.setResourceName(target);
        resource.setAPIClient(ctx.globals.api);
        resource.setPageSize(paginationState.pageSize);
        ctx.model.resource = resource;
      },
    },
    fieldNames: {
      use: 'titleField',
      title: tval('Title field'),
    },
    dataScope: {
      use: 'dataScope',
      title: tval('Set data scope'),
    },
    sortingRule: {
      use: 'sortingRule',
      title: tval('Set default sorting rules'),
    },
  },
});
