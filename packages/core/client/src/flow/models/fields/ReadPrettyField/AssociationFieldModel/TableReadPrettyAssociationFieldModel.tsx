/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { escapeT, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Tag } from 'antd';
import { castArray } from 'lodash';
import React from 'react';
import { ReadPrettyAssociationFieldModel } from './ReadPrettyAssociationFieldModel';
import { TableModel } from '../../../data-blocks/table/TableModel';

type Constructor<T = {}> = new (...args: any[]) => T;

function TableModelMixin<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    getColumns = TableModel.prototype.getColumns;
    renderComponent = TableModel.prototype.renderComponent;
    components = TableModel.prototype.components;
    EditableCell = TableModel.prototype.EditableCell;
    EditableRow = TableModel.prototype.EditableRow;
    renderCell = TableModel.prototype.renderCell;
    resource = {
      getData: () => {
        console.log(this);
        return this.field?.value || [];
      },
    };
  };
}

const CombinedBase = TableModelMixin(ReadPrettyAssociationFieldModel);

export class TableReadPrettyAssociationFieldModel extends CombinedBase {
  get collection() {
    return this.collectionField.targetCollection;
  }
  public static readonly supportedFieldInterfaces = [
    'm2m',
    'm2o',
    'o2o',
    'o2m',
    'oho',
    'obo',
    'updatedBy',
    'createdBy',
    'mbm',
  ];

  public render() {
    return (
      <div>
        {/* 渲染只读表格 */}
        {this.renderComponent?.()}
      </div>
    );
  }

  //    public render() {
  //       return <FlowModelRenderer/>
  //    }
}
