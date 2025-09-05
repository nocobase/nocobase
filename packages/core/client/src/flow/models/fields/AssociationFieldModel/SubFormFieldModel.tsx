/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { Card, Form, Button, Tooltip, Divider } from 'antd';
import React, { useRef } from 'react';
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
export const ObjectNester = (props) => {
  const model: any = useFlowModel();
  const gridModel = model.subModels.grid;
  const rowIndex = model.context.fieldIndex;
  // 在数组子表单场景下，为每个子项创建行内 fork，并透传当前行索引
  const grid = React.useMemo(() => {
    if (rowIndex == null) return gridModel;
    const fork = gridModel.createFork({}, `${rowIndex}`);
    fork.context.defineProperty('fieldIndex', {
      get: () => rowIndex,
    });
    return fork;
  }, [gridModel, rowIndex]);
  return (
    <Card>
      <FlowModelRenderer model={grid} showFlowSettings={false} />
    </Card>
  );
};
export class ObjectFormAssociationFieldModel extends FormAssociationFieldModel {
  static supportedFieldInterfaces = ['m2o', 'o2o', 'oho', 'obo', 'updatedBy', 'createdBy'];
  updateAssociation = true;
  onInit(options) {
    super.onInit(options);
  }
  get component() {
    return [ObjectNester, {}];
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
  const rowIndex = model.context.fieldIndex || [];
  // 用来缓存每行的 fork，保证每行只创建一次
  const forksRef = useRef<Record<string, any>>({});
  const collectionName = model.collectionField.name;
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
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name: index }) => {
              const uid = `${key}.${name}`;
              // 每行只创建一次 fork
              if (!forksRef.current[uid]) {
                const fork = gridModel.createFork();
                fork.context.defineProperty('fieldIndex', {
                  get: () => [...rowIndex, `${collectionName}:${index}`],
                });
                forksRef.current[uid] = fork;
              }

              return (
                <div key={uid} style={{ marginBottom: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <Tooltip title={t('Remove')}>
                      <CloseOutlined
                        style={{ zIndex: 1000, color: '#a8a3a3' }}
                        onClick={() => {
                          remove(index);
                          // 删除 fork 缓存
                          delete forksRef.current[uid];
                        }}
                      />
                    </Tooltip>
                  </div>
                  <FlowModelRenderer model={forksRef.current[uid]} showFlowSettings={false} />
                  <Divider />
                </div>
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
  updateAssociation = true;
  onInit(options) {
    super.onInit(options);
  }
  get component() {
    return [ArrayNester, {}];
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
