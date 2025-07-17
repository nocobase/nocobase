/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { ArrayField, ObjectField, observer, useField } from '@formily/react';
import { tval } from '@nocobase/utils/client';
import {
  AddFieldButton,
  buildFieldItems,
  escapeT,
  FlowModel,
  FlowModelRenderer,
  useFlowModel,
} from '@nocobase/flow-engine';
import { castArray } from 'lodash';
import { FormLayout } from '@formily/antd-v5';
import { Card } from 'antd';
import React from 'react';
import { EditableAssociationFieldModel } from './EditableAssociationFieldModel';
import { FormCustomFormItemModel } from '../../../data-blocks/form/FormCustomFormItemModel';
import { EditableFieldModel } from '../../EditableField/EditableFieldModel';
import { FormModel } from '../../../data-blocks/form/FormModel';

const ArrayNester = (props) => {
  const model: any = useFlowModel();
  const { fieldPath } = props;
  const formModelInstance = model.context.blockModel as FormModel;
  const fieldItems = buildFieldItems(
    formModelInstance.collectionField.targetCollection.getFields(),
    formModelInstance,
    'EditableFieldModel',
    'items',
    ({ defaultOptions, fieldPath }) => ({
      use: defaultOptions.use,
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: formModelInstance.collection.dataSourceKey,
            collectionName: formModelInstance.collection.name,
            fieldPath,
          },
        },
      },
    }),
  );
  return (
    <FormLayout layout="vertical">
      <ArrayField name={fieldPath}>
        {(field) => (
          <div>
            {field.value?.map((item, index) => {
              return (
                <div key={index}>
                  {model.mapSubModels('items', (subModel) => {
                    const fork = subModel.createFork({}, `${index}`);
                    fork.context.defineProperty('basePath', {
                      get: () => index,
                    });
                    return <FlowModelRenderer key={subModel.key || index} model={fork} />;
                  })}
                </div>
              );
            })}
          </div>
        )}
      </ArrayField>
      <AddFieldButton
        model={model}
        items={fieldItems}
        subModelKey={'items'}
        subModelBaseClass={FormCustomFormItemModel}
        onSubModelAdded={async (field: EditableFieldModel) => {
          model.context.blockModel.addAppends(field.fieldPath, true);
        }}
      />
    </FormLayout>
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
export class SubFormEditableAssociationFieldModel extends EditableAssociationFieldModel {
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

SubFormEditableAssociationFieldModel.registerFlow({
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
