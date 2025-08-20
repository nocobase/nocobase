/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormButtonGroup, FormLayout } from '@formily/antd-v5';
import { createForm, Form } from '@formily/core';
import { FormProvider } from '@formily/react';
import { AddSubModelButton, Collection, FlowModelRenderer, FlowSettingsButton } from '@nocobase/flow-engine';
import { SettingOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import React from 'react';
import { tval } from '@nocobase/utils/client';
import { FilterBlockModel } from '../../base/BlockModel';

export class FilterFormModel extends FilterBlockModel {
  form: Form;
  collection: Collection;

  render() {
    return (
      <Card>
        <FormProvider form={this.form}>
          <FormLayout layout={'vertical'}>
            {this.mapSubModels('fields', (field) => (
              <FlowModelRenderer model={field} showFlowSettings={{ showBorder: false }} />
            ))}
          </FormLayout>
          <AddSubModelButton
            key="filter-form-fields-add"
            subModelKey="fields"
            model={this}
            keepDropdownOpen
            // TODO: 这里字段重构后要改错字段对应的 form item model 才能显示下拉菜单
            subModelBaseClasses={['EditableFieldModel']}
          >
            <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Fields')}</FlowSettingsButton>
          </AddSubModelButton>
          <FormButtonGroup>
            {this.mapSubModels('actions', (action) => (
              <FlowModelRenderer model={action} showFlowSettings={{ showBorder: false }} />
            ))}
            <AddSubModelButton
              key="filter-form-actions-add"
              model={this}
              subModelKey="actions"
              subModelBaseClass={'FilterFormActionModel'}
            >
              <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
            </AddSubModelButton>
          </FormButtonGroup>
        </FormProvider>
      </Card>
    );
  }
}

FilterFormModel.define({
  hide: true,
  label: tval('Form'),
});

FilterFormModel.registerFlow({
  key: 'default',
  steps: {
    step1: {
      paramsRequired: true,
      hideInSettings: true,
      uiSchema: {
        dataSourceKey: {
          type: 'string',
          title: tval('Data Source Key'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: tval('Enter data source key'),
          },
        },
        collectionName: {
          type: 'string',
          title: tval('Collection Name'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: tval('Enter collection name'),
          },
        },
      },
      defaultParams: {
        dataSourceKey: 'main',
      },
      async handler(ctx, params) {
        ctx.model.form = ctx.inputArgs.form || createForm();
        if (!ctx.model.collection) {
          ctx.model.collection = ctx.dataSourceManager.getCollection(params.dataSourceKey, params.collectionName);
        }
      },
    },
  },
});
