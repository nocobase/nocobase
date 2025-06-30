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
import { useFlowModel, FlowModel } from '@nocobase/flow-engine';
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
        const { target } = ctx.model.collectionField;
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
          console.error('Scroll pagination request failed:', error);
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
          const targetCollection = ctx.model.collectionField.targetCollection;
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

AssociationSelectEditableFieldModel.registerFlow({
  key: 'fieldNames',
  title: tval('Specific properties'),
  auto: true,
  sort: 200,
  steps: {
    fieldNames: {
      use: 'titleField',
      title: tval('Title field'),
    },
  },
});
