/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React, { useState, useRef } from 'react';
import { Spin, Select } from 'antd';
import { connect, mapReadPretty, mapProps } from '@formily/react';
import { FormFieldModel } from '../../../FormFieldModel';

const PAGE_SIZE = 200;

function LazySelect({ fetchOptions, ...restProps }) {
  return <Select showSearch {...restProps} />;
}

export const AssociationSelect = connect(
  (props: any) => {
    return <LazySelect {...props} />;
  },
  mapProps(
    {
      dataSource: 'options',
    },
    (props, field) => {
      console.log(props);
      return {
        ...props,
      };
    },
  ),
  mapReadPretty((props) => {
    return props.value;
  }),
);

export class AssociationSelectFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy'];
  declare options;
  declare fieldNames: { label: string; value: string; color?: string; icon?: any };

  set onPopupScroll(fn) {
    this.field.setComponentProps({ onPopupScroll: fn });
  }
  set onDropdownVisibleChange(fn) {
    this.field.setComponentProps({ onDropdownVisibleChange: fn });
  }
  setDataSource(dataSource) {
    this.field.dataSource = dataSource;
  }
  setFieldNames(fieldNames) {
    this.fieldNames = fieldNames;
  }
  get component() {
    return [AssociationSelect, {}];
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
        });
        const { data } = response.data;
        ctx.model.setDataSource(data);
        console.log(data);
        console.log(response);
      },
    },
  },
});

AssociationSelectFieldModel.registerFlow({
  key: 'event2',
  on: {
    eventName: 'popupScroll',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        const { target } = ctx.model.collectionField.options;
        const apiClient = ctx.app.apiClient;
        const response = await apiClient.request({
          url: `/${target}:list`,
        });
        console.log(ctx);
        console.log(response);
      },
    },
  },
});
