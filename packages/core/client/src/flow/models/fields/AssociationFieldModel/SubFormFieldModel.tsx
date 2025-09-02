/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, FlowModel, MultiRecordResource, useFlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { Card } from 'antd';
import React from 'react';
import { AssociationFieldModel } from './AssociationFieldModel';
import { FormComponent } from '../../data-blocks/form/FormModel';
import { FormItem } from '../../data-blocks/form/FormItem/FormItem';

const ToOneSubForm = (props) => {
  const { model } = props;
  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <FormItem noStyle shouldUpdate>
        {({ getFieldValue }) => (
          <>
            <FlowModelRenderer model={model.subModels.grid} showFlowSettings={false} />
          </>
        )}
      </FormItem>
    </Card>
  );
};

const ToManySubForm = () => {
  return <div />;
};
export const SubForm = (props) => {
  if (props.multiple) {
    return <ToManySubForm {...props} />;
  } else {
    return <ToOneSubForm {...props} />;
  }
};

export class SubFormFieldModel extends AssociationFieldModel {
  static supportedFieldInterfaces = ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'];

  get component() {
    return [SubForm, { model: this }];
  }
}

SubFormFieldModel.define({
  createModelOptions: {
    use: 'SubFormFieldModel',
    subModels: {
      grid: {
        use: 'FormFieldGridModel',
      },
    },
  },
  sort: 350,
});
