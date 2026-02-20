/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { tExpr, FlowModelRenderer, useFlowModel } from '@nocobase/flow-engine';
import { Card, Divider } from 'antd';
import React, { useRef } from 'react';
import { castArray } from 'lodash';
import { FormItemModel } from '../../blocks/form/FormItemModel';
import { FieldModel } from '../../base';
import { DetailsItemModel } from '../../blocks/details/DetailsItemModel';

const ArrayNester = ({ name, value = [] }: any) => {
  const model: any = useFlowModel();
  const gridModel = model.subModels.grid;
  const rowIndex = model.context.fieldIndex;
  const resultIndex = castArray(rowIndex).filter(Boolean);
  const record = model.context.record;
  const collectionName = model.context.collectionField.name;
  const isConfigMode = !!model.context.flowSettingsEnabled;
  const resultValue = isConfigMode && value.length === 0 ? [{}] : value;
  const resource = model.context.blockModel.resource;
  const blockPage = resource?.getPage?.() || 0;
  return (
    resultValue.length > 0 && (
      <Card
        bordered={true}
        style={{ position: 'relative' }}
        className={css`
          > .ant-card-body > .ant-divider:last-child {
            display: none;
          }
        `}
      >
        {resultValue.map((item: any, index: number) => {
          const key = `row_${index}_${blockPage}`;
          const fork = gridModel.createFork({}, `${key}`);
          fork.gridContainerRef = React.createRef<HTMLDivElement>();
          const parentItem = model?.context?.item;
          fork.context.defineProperty('fieldIndex', {
            get: () => [...resultIndex, `${collectionName}:${index}`],
          });
          fork.context.defineProperty('fieldKey', {
            get: () => key,
          });
          fork.context.defineProperty('record', {
            get: () => record,
          });
          fork.context.defineProperty('currentObject', {
            get: () => item,
          });
          fork.context.defineProperty('item', {
            get: () => ({
              index,
              length: resultValue.length,
              __is_new__: item?.__is_new__,
              __is_stored__: item?.__is_stored__,
              value: item,
              parentItem,
            }),
            cache: false,
          });

          return (
            <div key={key} style={{ marginBottom: 12 }}>
              <FlowModelRenderer model={fork} showFlowSettings={false} />
              <Divider />
            </div>
          );
        })}
      </Card>
    )
  );
};

export class DisplaySubListFieldModel extends FieldModel {
  disableTitleField = true;
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
  label: tExpr('Sub-detail'),
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
