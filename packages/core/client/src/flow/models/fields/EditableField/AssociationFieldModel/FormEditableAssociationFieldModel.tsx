/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { observer, useField } from '@formily/react';
import { tval } from '@nocobase/utils/client';
import { escapeT, FlowModel, FlowModelRenderer, useFlowModel } from '@nocobase/flow-engine';
import { each } from '@formily/shared';
import { action } from '@formily/reactive';
import { FormLayout } from '@formily/antd-v5';
import { Card } from 'antd';
import React from 'react';
import { ArrayField as ArrayFieldType } from '@formily/core';
import { EditableAssociationFieldModel } from './EditableAssociationFieldModel';

const ArrayNester = observer((props) => {
  const model = useFlowModel();
  const { fieldPath } = model;
  const arrayField = useField<ArrayFieldType>();
  const value = [...(arrayField.value || [{}])];

  return (
    <>
      <FormLayout layout="vertical">
        {value.map((_, index) => {
          const gridModel = model.subModels.grid as FlowModel;
          const fork = gridModel.createFork({}, `${index}`);
          fork.context.defineProperty('basePath', {
            get: () => {
              const basePath = model?.context.basePath;
              const finalPath = basePath ? `${basePath}.${fieldPath}.${index}` : `${fieldPath}.${index}`;
              return finalPath;
            },
          });
          return (
            <Card key={index} style={{ marginBottom: 12 }}>
              <FlowModelRenderer model={fork} showFlowSettings={false} key={index} />
            </Card>
          );
        })}
      </FormLayout>
      {arrayField.editable && (
        <a
          onClick={() => {
            action(() => {
              if (!Array.isArray(arrayField.value)) {
                arrayField.value = [{}];
              }
              const index = arrayField.value.length;
              arrayField.value.splice(index, 0, {});
              each(arrayField.form.fields, (targetField, key) => {
                if (!targetField) {
                  delete arrayField.form.fields[key];
                }
              });
              arrayField.onInput(arrayField.value);
            });
          }}
        >
          {escapeT('Add new')}
        </a>
      )}
    </>
  );
});

const ObjectNester = (props) => {
  const model: any = useFlowModel();
  return (
    <Card>
      <FormLayout layout={'vertical'}>
        <FlowModelRenderer model={model.subModels.grid} showFlowSettings={false} />
      </FormLayout>
    </Card>
  );
};

class FormEditableAssociationFieldModel extends EditableAssociationFieldModel {
  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('currentCollection', {
      value: this.collectionField.targetCollection,
    });
  }
}

export class ObjectFormEditableAssociationFieldModel extends FormEditableAssociationFieldModel {
  static supportedFieldInterfaces = ['m2o', 'o2o', 'oho', 'obo', 'updatedBy', 'createdBy'];
  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('basePath', {
      get: () => {
        const basePath = this.parent?.context.basePath;
        return basePath ? `${basePath}.${this.fieldPath}` : this.fieldPath;
      },
    });
  }
  get component() {
    return [
      ObjectNester,
      {
        type: this.collectionField.type,
      },
    ];
  }
}

ObjectFormEditableAssociationFieldModel.define({
  defaultOptions: {
    use: 'ObjectFormEditableAssociationFieldModel',
    subModels: {
      grid: {
        use: 'FormFieldGridModel',
      },
    },
  },
});

export class ArrayFormEditableAssociationFieldModel extends FormEditableAssociationFieldModel {
  static supportedFieldInterfaces = ['m2m', 'o2m', 'mbm'];
  get component() {
    return [
      ArrayNester,
      {
        type: this.collectionField.type,
      },
    ];
  }
}

ArrayFormEditableAssociationFieldModel.define({
  defaultOptions: {
    use: 'ArrayFormEditableAssociationFieldModel',
    subModels: {
      grid: {
        use: 'FormFieldGridModel',
      },
    },
  },
});
