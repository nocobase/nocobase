/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { escapeT, FlowModelRenderer, useFlowModel } from '@nocobase/flow-engine';
import { Card, Divider } from 'antd';
import React, { useRef } from 'react';
import { FormItemModel } from '../../blocks/form/FormItemModel';
import { FieldModel } from '../../base';
import { DetailsItemModel } from '../../blocks/details/DetailsItemModel';

const ArrayNester = ({ name, value = [] }: any) => {
  const model: any = useFlowModel();
  const gridModel = model.subModels.grid;

  // 用来缓存每行的 fork，保证每行只创建一次
  const forksRef = useRef<Record<string, any>>({});
  const rowIndex = model.context.fieldIndex || [];
  const collectionName = model.context.collectionField.name;

  return (
    value.length > 0 && (
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
              get: () => [...rowIndex, `${collectionName}:${index}`],
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
    )
  );
};

export class DisplaySubListFieldModel extends FieldModel {
  subModelBaseClasses = {
    action: 'RecordActionGroupModel' as any,
    field: ['DetailsItemModel'] as any,
  };

  getAddSubModelButtonProps(type: 'action' | 'field') {
    const subClass = this.subModelBaseClasses[type];
    if (Array.isArray(subClass)) {
      return {
        subModelBaseClasses: subClass,
      };
    }
    return {
      subModelBaseClass: subClass,
    };
  }
  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('collection', {
      get: () => this.context.collectionField.targetCollection,
    });
    this.context.defineProperty('prefixFieldPath', {
      get: () => {
        return (this.parent as FormItemModel).fieldPath;
      },
    });
  }
  render() {
    return <ArrayNester {...this.props} />;
  }
}

DisplaySubListFieldModel.define({
  label: escapeT('Sub-detail'),
  createModelOptions: {
    use: 'DisplaySubListFieldModel',
    subModels: {
      grid: {
        use: 'DetailsGridModel',
      },
    },
  },
});

DetailsItemModel.bindModelToInterface('DisplaySubListFieldModel', ['m2m', 'o2m', 'mbm']);
