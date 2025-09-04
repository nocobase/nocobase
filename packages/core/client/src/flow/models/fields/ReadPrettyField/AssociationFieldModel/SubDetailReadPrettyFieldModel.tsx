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
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from '@emotion/css';
import { FormItemModel } from '../../../data-blocks/form/FormItem/FormItemModel';
import { ReadPrettyAssociationFieldModel } from './ReadPrettyAssociationFieldModel';

const ObjectNester = (props) => {
  const model: any = useFlowModel();
  return (
    <Card>
      <FlowModelRenderer model={model.subModels.grid} showFlowSettings={false} />
    </Card>
  );
};
export class ObjectDetailAssociationFieldModel extends ReadPrettyAssociationFieldModel {
  static supportedFieldInterfaces = ['m2o', 'o2o', 'oho', 'obo', 'updatedBy', 'createdBy'];

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
  public render() {
    return <ObjectNester {...this.props} />;
  }
}

ObjectDetailAssociationFieldModel.define({
  createModelOptions: {
    use: 'ObjectDetailAssociationFieldModel',
    subModels: {
      grid: {
        use: 'DetailsFieldGridModel',
      },
    },
  },
});

const ArrayNester = ({ name, value }: any) => {
  const model: any = useFlowModel();
  const gridModel = model.subModels.grid;

  // 用来缓存每行的 fork，保证每行只创建一次
  const forksRef = useRef<Record<string, any>>({});

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
      {value.map((item: any, index: number) => {
        const key = `row_${index}`;
        if (!forksRef.current[key]) {
          const fork = gridModel.createFork();
          fork.context.defineProperty('fieldIndex', {
            get: () => index,
          });
          forksRef.current[key] = fork;
        }

        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <FlowModelRenderer model={forksRef.current[key]} showFlowSettings={false} />
            <Divider />
          </div>
        );
      })}
    </Card>
  );
};

export class ArrayDetailAssociationFieldModel extends ReadPrettyAssociationFieldModel {
  static supportedFieldInterfaces = ['m2m', 'o2m', 'mbm'];
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
  render() {
    return <ArrayNester {...this.props} name={this.collectionField.name} />;
  }
}

ArrayDetailAssociationFieldModel.define({
  createModelOptions: {
    use: 'ArrayDetailAssociationFieldModel',
    subModels: {
      grid: {
        use: 'DetailsFieldGridModel',
      },
    },
  },
});
