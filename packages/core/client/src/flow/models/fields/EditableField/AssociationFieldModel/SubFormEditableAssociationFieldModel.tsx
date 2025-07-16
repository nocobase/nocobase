/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { escapeT, FlowModel, FlowModelRenderer, useFlowModel } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { castArray } from 'lodash';
import { FormLayout } from '@formily/antd-v5';
import React from 'react';
import { EditableAssociationFieldModel } from './EditableAssociationFieldModel';

const Nester = (props) => {
  const model = useFlowModel();
  return (
    <FormLayout layout={'vertical'}>
      <FlowModelRenderer model={model.subModels.subForm} showFlowSettings={false} />
    </FormLayout>
  );
};

const AssociationNester = connect((props: any) => {
  return <Nester {...props} />;
});

export class SubFormEditableAssociationFieldModel extends EditableAssociationFieldModel {
  static supportedFieldInterfaces = ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'];

  get component() {
    console.log(this);
    return [AssociationNester, {}];
  }
}

SubFormEditableAssociationFieldModel.registerFlow({
  auto: true,
  key: 'subFormSetting',
  sort: 600,
  steps: {
    init: {
      async handler(ctx) {
        console.log(ctx);
        const model = ctx.model;
        if (model.subModels.subForm) {
          return;
        }
        const use = ctx.model.parent.parent.constructor.name;
        const addedModel = ctx.model.flowEngine.createModel({
          use,
          stepParams: {
            resourceSettings: {
              init: {
                dataSourceKey: model.collectionField.dataSourceKey,
                collectionName: model.collectionField.target,
              },
            },
          },
          subModels: {
            grid: {
              use: 'FormFieldGridModel',
            },
          },
          parentId: model.uid,
          subKey: 'subForm',
          subType: 'object',
        });

        addedModel.setParent(model);
        await addedModel.configureRequiredSteps();
        await addedModel.save();
      },
    },
  },
});
