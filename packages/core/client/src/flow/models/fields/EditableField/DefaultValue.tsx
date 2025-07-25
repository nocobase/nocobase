/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormLayout } from '@formily/antd-v5';
import { createForm, Form } from '@formily/core';
import { FormProvider } from '@formily/react';
import { uid } from '@formily/shared';
import { FlowModel, FlowModelRenderer, useFlowSettingsContext } from '@nocobase/flow-engine';
import React, { useMemo } from 'react';

class DefaultValueFormModel extends FlowModel {
  form: Form;

  onInit(options: any): void {
    this.form = createForm();
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

export function DefaultValue() {
  const ctx = useFlowSettingsContext();
  const model = useMemo(() => {
    ctx.engine.registerModels({ DefaultValueFormModel });
    const options = {
      use: 'DefaultValueFormModel',
      subModels: {
        fields: [
          {
            uid: uid(),
            parentId: null,
            subKey: null,
            subType: null,
            ...ctx.model.serialize(),
          },
        ],
      },
    };
    return ctx.engine.createModel(options as any);
  }, []);
  return (
    <div>
      <FlowModelRenderer model={model} showFlowSettings={false} />
    </div>
  );
}
