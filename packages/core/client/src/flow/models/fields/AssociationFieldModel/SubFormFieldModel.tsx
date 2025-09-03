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
import { CloseOutlined, PlusOutlined, ZoomInOutlined } from '@ant-design/icons';
import { Card, Form, Button, Tooltip } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { css } from '@emotion/css';
import { AssociationFieldModel } from './AssociationFieldModel';
import { FormComponent } from '../../data-blocks/form/FormModel';
import { FormItemModel } from '../../data-blocks/form/FormItem/FormItemModel';
import { each } from '@formily/shared';
import { action } from '@formily/reactive';

const ArrayNester = ({ name }: { name: string }) => {
  const model: any = useFlowModel();
  const gridModel = model.subModels.grid;
  const { t } = useTranslation();
  return (
    <Form.List name={name} initialValue={[{}]}>
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name, ...restField }) => {
            // 给每个子项生成一个 fork model
            const fork = gridModel.createFork({});
            return (
              <Card
                key={key}
                bordered={true}
                style={{ position: 'relative' }}
                className={css`
                  > .ant-card-body > .ant-divider:last-child {
                    display: none;
                  }
                `}
              >
                <div style={{ textAlign: 'right' }}>
                  <Tooltip key={'remove'} title={t('Remove')}>
                    <CloseOutlined style={{ zIndex: 1000, color: '#a8a3a3' }} onClick={() => remove(name)} />
                  </Tooltip>
                </div>
                {/* 渲染 fork model */}
                <FlowModelRenderer model={fork} showFlowSettings={false} />
              </Card>
            );
          })}
          <Button type="dashed" onClick={() => add()} block>
            添加一项
          </Button>
        </>
      )}
    </Form.List>
  );
};

const ObjectNester = (props) => {
  const model: any = useFlowModel();
  return (
    <Card>
      <FlowModelRenderer model={model.subModels.grid} showFlowSettings={false} />
    </Card>
  );
};

class FormAssociationFieldModel extends AssociationFieldModel {
  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('collection', {
      get: () => this.collectionField.targetCollection,
    });
    this.context.defineProperty('prefixFieldPath', {
      get: () => {
        return (this.parent as FormItemModel).fieldPath;
      },
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
        name: this.collectionField.name,
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
