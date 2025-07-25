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
import { connect, FormProvider } from '@formily/react';
import { uid } from '@formily/shared';
import { FlowModel, FlowModelRenderer, useFlowSettingsContext } from '@nocobase/flow-engine';
import React, { useMemo } from 'react';
import { FieldModel } from '../../base/FieldModel';

class DefaultValueFormModel extends FlowModel {
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
    });
  }

  public render() {
    return (
      <FormProvider form={this.form}>
        <FormLayout layout={'vertical'}>
          {this.mapSubModels('fields', (field) => {
            return <FlowModelRenderer key={field.uid} model={field} />;
          })}
        </FormLayout>
      </FormProvider>
    );
  }
}

export const DefaultValue = connect((props) => {
  const { value, onChange } = props;
  const ctx = useFlowSettingsContext<FieldModel>();
  const model = useMemo(() => {
    ctx.engine.registerModels({ DefaultValueFormModel });
    const fieldPath = ctx.model.fieldPath;
    const options = {
      use: 'DefaultValueFormModel',
      subModels: {
        fields: [
          {
            ...ctx.model.serialize(),
            uid: uid(),
            parentId: null,
            subKey: null,
            subType: null,
          },
        ],
      },
    };
    const model = ctx.engine.createModel(options as any) as DefaultValueFormModel;
    model.form.values = { fieldPath: value };
    model.onChange = (values) => {
      onChange(values[fieldPath]);
    };
    return model;
  }, []);
  return (
    <div>
      <FlowModelRenderer model={model} showFlowSettings={false} />
    </div>
  );
});
