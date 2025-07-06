/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { reactive } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import React from 'react';
import { FieldModel } from '../../base/FieldModel';

export class ReadPrettyFieldModel extends FieldModel {
  getValue() {
    return this.ctx.shared.value;
  }
  @reactive
  public render() {
    return (
      <span>
        {this.props.prefix}
        {this.translate(this.getValue())}
        {this.props.suffix}
      </span>
    );
  }
}
ReadPrettyFieldModel.registerFlow({
  key: 'ReadPrettyFieldDefault',
  auto: true,
  title: tval('Basic'),
  sort: 100,
  steps: {
    step1: {
      handler(ctx, params) {
        const { collectionField } = ctx.model;
        ctx.model.setProps(collectionField.getComponentProps());
        if (collectionField.enum.length) {
          ctx.model.setProps({ dataSource: collectionField.enum });
        }
      },
    },
  },
});
