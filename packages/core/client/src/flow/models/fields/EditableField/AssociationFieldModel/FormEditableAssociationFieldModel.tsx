/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { ObjectField, ArrayField, observer, useField } from '@formily/react';
import { tval } from '@nocobase/utils/client';
import {
  AddFieldButton,
  buildFieldItems,
  escapeT,
  FlowModel,
  FlowModelRenderer,
  useFlowModel,
} from '@nocobase/flow-engine';
import { each } from '@formily/shared';
import { action } from '@formily/reactive';
import { castArray } from 'lodash';
import { FormLayout } from '@formily/antd-v5';
import { Card } from 'antd';
import React from 'react';
import { ArrayField as ArrayFieldType } from '@formily/core';
import { EditableAssociationFieldModel } from './EditableAssociationFieldModel';

const ArrayNester = (props) => {
  const model = useFlowModel();
  const { fieldPath } = model;
  const arrayField = useField<ArrayFieldType>();
  const value = arrayField.value || [];
  return (
    <>
      <FormLayout layout="vertical">
        {value.map((_, index) => {
          console.log(`${fieldPath}.${index}`);
          const gridModel = model.subModels.grid as FlowModel;
          // const fork = gridModel.createFork({}, `${index}`);
          gridModel.context.defineProperty('basePath', {
            get: () => `${fieldPath}.${index}`,
          });
          return (
            <Card key={index} style={{ marginBottom: 12 }}>
              <FlowModelRenderer model={gridModel} showFlowSettings={false} />
            </Card>
          );
        })}
      </FormLayout>
      {arrayField.editable && (
        <a
          onClick={() => {
            action(async () => {
              if (!Array.isArray(arrayField.value)) {
                arrayField.value = [];
              }
              const index = arrayField.value.length;
              arrayField.value.splice(index, 0, {});
              each(arrayField.form.fields, (targetField, key) => {
                if (!targetField) {
                  delete arrayField.form.fields[key];
                }
              });
              return arrayField.onInput(arrayField.value);
            });
          }}
        >
          {escapeT('Add new')}
        </a>
      )}
    </>
  );
};

const ObjectNester = (props) => {
  const model = useFlowModel();
  return (
    <Card>
      <FormLayout layout={'vertical'}>
        <FlowModelRenderer model={model.subModels.grid} showFlowSettings={false} />
      </FormLayout>
    </Card>
  );
};

const AssociationNester = connect((props: any) => {
  if (['hasOne', 'belongs'].includes(props.type)) {
    return <ObjectNester {...props} />;
  }
  return <ArrayNester {...props} />;
});
export class FormEditableAssociationFieldModel extends EditableAssociationFieldModel {
  static supportedFieldInterfaces = ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'];

  get component() {
    return [
      AssociationNester,
      {
        type: this.collectionField.type,
      },
    ];
  }
  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('currentCollection', {
      value: this.collectionField.targetCollection,
    });
    this.context.defineProperty('basePath', {
      value: this.basePath ? `${this.basePath}.${this.fieldPath}` : this.fieldPath,
    });
  }
}

FormEditableAssociationFieldModel.registerFlow({
  auto: true,
  key: 'subFormSetting',
  sort: 600,
  steps: {
    init: {
      async handler(ctx) {
        if (ctx.model.subModels.grid) {
          return;
        }
        const model = ctx.model.setSubModel('grid', {
          use: 'FormFieldGridModel',
        });
        await model.applyAutoFlows();
      },
    },
  },
});
