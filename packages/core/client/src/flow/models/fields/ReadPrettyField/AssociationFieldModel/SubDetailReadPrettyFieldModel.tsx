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
