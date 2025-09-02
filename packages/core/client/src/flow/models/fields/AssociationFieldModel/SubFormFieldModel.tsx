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
import { Card, Form, Button } from 'antd';
import React from 'react';
import { AssociationFieldModel } from './AssociationFieldModel';
import { FormComponent } from '../../data-blocks/form/FormModel';
import { FormItem } from '../../data-blocks/form/FormItem/FormItem';
import { each } from '@formily/shared';
import { action } from '@formily/reactive';

const ArrayNester = ({ name, gridModel }: { name: string; gridModel: FlowModel }) => {
  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...restField }) => {
            // 给每个子项生成一个 fork model
            const fork = gridModel.createFork({}, `${name}`);
            return (
              <Card key={key} style={{ marginBottom: 12 }}>
                {/* 渲染 fork model */}
                <FlowModelRenderer model={fork} showFlowSettings={false} />
                <Button type="link" danger onClick={() => remove(name)}>
                  删除
                </Button>
              </Card>
            );
          })}
          <Button type="dashed" onClick={() => add({})} block>
            添加一项
          </Button>
        </>
      )}
    </Form.List>
  );
};

const ObjectNester = (props) => {
  const model: any = useFlowModel();
  console.log(model);
  return (
    <Card>
      <FlowModelRenderer model={model.subModels.grid} showFlowSettings={false} />
    </Card>
  );
};

class FormAssociationFieldModel extends AssociationFieldModel {
  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('currentCollection', {
      value: this.collectionField.targetCollection,
    });
  }
}

export class ObjectFormAssociationFieldModel extends FormAssociationFieldModel {
  static supportedFieldInterfaces = ['m2o', 'o2o', 'oho', 'obo', 'updatedBy', 'createdBy'];
  onInit(options) {
    super.onInit(options);
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

ObjectFormAssociationFieldModel.define({
  createModelOptions: {
    use: 'ObjectFormAssociationFieldModel',
    subModels: {
      grid: {
        use: 'FormFieldGridModel',
      },
    },
  },
});

export class ArrayFormAssociationFieldModel extends FormAssociationFieldModel {
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

ArrayFormAssociationFieldModel.define({
  createModelOptions: {
    use: 'ArrayFormAssociationFieldModel',
    subModels: {
      grid: {
        use: 'FormFieldGridModel',
      },
    },
  },
});
