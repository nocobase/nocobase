/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormLayout } from '@formily/antd-v5';
import { createForm, Form, onFieldValueChange, onFormValuesChange } from '@formily/core';
import { FormProvider } from '@formily/react';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';

export class VariableFieldFormModel extends FlowModel {
  form: Form;
  onChange;

  addAppends(fieldPath: string) {}

  onInit(options: any): void {
    const self = this;
    this.form = createForm({
      effects(form) {
        onFormValuesChange((form) => {
          self.onChange?.(form.values);
        });
        onFieldValueChange('*', (field) => {
          field.componentProps?.onChange?.(field.value);
        });
      },
    });
    this.context.defineProperty('blockModel', {
      get: () => this,
    });
    this.context.defineProperty('form', {
      get: () => this.form,
    });
    this.context.defineProperty('record', {
      get: () => {},
      cache: false,
    });
  }

  public render() {
    return (
      <FormProvider form={this.form}>
        <FormLayout layout={'vertical'}>
          {this.mapSubModels('fields', (field) => {
            // 确保字段模型具备稳定的 id/name，便于依赖路径的组件（如公式字段）正确解析
            const init = field?.getStepParams?.('fieldSettings', 'init') || {};
            const fp = init?.fieldPath as string | undefined;
            if (fp) {
              const namePath = fp.includes('.') ? fp.split('.') : [fp];
              const toSet: any = {};
              if (!field?.props?.id) toSet.id = namePath;
              if (!field?.props?.name) toSet.name = namePath;
              if (Object.keys(toSet).length) field?.setProps?.(toSet);
            }
            return <FlowModelRenderer key={field.uid} model={field} />;
          })}
        </FormLayout>
      </FormProvider>
    );
  }
}
