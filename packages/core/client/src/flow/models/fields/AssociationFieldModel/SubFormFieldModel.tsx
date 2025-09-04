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
import { Card, Form, Button, Tooltip, Divider } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { css } from '@emotion/css';
import { AssociationFieldModel } from './AssociationFieldModel';
import { FormItemModel } from '../../data-blocks/form/FormItem/FormItemModel';

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
const ObjectNester = (props) => {
  const model: any = useFlowModel();
  return (
    <Card>
      <FlowModelRenderer model={model.subModels.grid} showFlowSettings={false} />
    </Card>
  );
};
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

const ArrayNester = ({ name, value }: any) => {
  const model: any = useFlowModel();
  const gridModel = model.subModels.grid;
  const { t } = useTranslation();
  return (
    <Card
      bordered={true}
      style={{ position: 'relative' }}
      className={css`
        > .ant-card-body > .ant-divider:last-child {
          display: none;
        }
      `}
    >
      <Form.List name={name} initialValue={value || [{}]}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name: index, ...restField }) => {
              const fork = gridModel.createFork({}, `${index}`);
              fork.context.defineProperty('fieldIndex', {
                get: () => {
                  return index;
                },
              });
              return (
                <>
                  <div style={{ textAlign: 'right' }}>
                    <Tooltip key={'remove'} title={t('Remove')}>
                      <CloseOutlined style={{ zIndex: 1000, color: '#a8a3a3' }} onClick={() => remove(index)} />
                    </Tooltip>
                  </div>
                  <FlowModelRenderer model={fork} showFlowSettings={false} key={index} />
                  <Divider />
                </>
              );
            })}
            <Button type="link" onClick={() => add()}>
              <PlusOutlined />
              {t('Add new')}
            </Button>
          </>
        )}
      </Form.List>
    </Card>
  );
};

export class ArrayFormAssociationFieldModel extends FormAssociationFieldModel {
  static supportedFieldInterfaces = ['m2m', 'o2m', 'mbm'];
  onInit(options) {
    super.onInit(options);
  }
  get component() {
    return [
      ArrayNester,
      {
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
