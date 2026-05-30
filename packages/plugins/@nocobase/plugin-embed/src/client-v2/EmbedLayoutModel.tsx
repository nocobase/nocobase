/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseLayoutModel, getLayoutModel, type GetLayoutModelOptions } from '@nocobase/client-v2';
import { type FlowEngine, FlowModel } from '@nocobase/flow-engine';
import React from 'react';
import { EMBED_LAYOUT_MODEL_UID } from './constants';
import { EmbedLayoutComponent } from './EmbedLayoutComponent';

/**
 * Embed Layout 的 v2 运行时模型。
 */
export class EmbedLayoutModelV2 extends BaseLayoutModel {
  render() {
    return (
      <EmbedLayoutComponent {...this.props} model={this}>
        {this.props.children}
      </EmbedLayoutComponent>
    );
  }
}

export function getEmbedLayoutModel<TModel extends FlowModel = EmbedLayoutModelV2>(
  flowEngine: FlowEngine,
  options: GetLayoutModelOptions<TModel> = {},
) {
  return getLayoutModel<TModel>(flowEngine, EMBED_LAYOUT_MODEL_UID, {
    ...options,
    use: (options.use || EmbedLayoutModelV2) as any,
  });
}
