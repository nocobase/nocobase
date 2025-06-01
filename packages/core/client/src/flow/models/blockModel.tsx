/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// TODO: 这个是测试用，后续会删掉
import { FlowModel } from '@nocobase/flow-engine';
import React from 'react';

export class BlockModel extends FlowModel {
  render() {
    const { type, content } = this.getProps();
    return (
      <div
        style={{
          padding: '16px',
          border: '1px solid #e8e8e8',
          borderRadius: '4px',
          backgroundColor: '#fafafa',
          marginBottom: '16px',
        }}
      >
        <div>{content || 'Block content'}</div>
      </div>
    );
  }
}

BlockModel.registerFlow('defaultFlow', {
  key: 'defaultFlow',
  auto: true,
  steps: {
    setBlockInfo: {
      handler(_ctx, model: BlockModel, params) {
        model.setProps('content', params.content || 'Default block content');
      },
    },
  },
});
