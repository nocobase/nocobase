/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockModel, editMarkdownFlow } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class MarkdownBlockModel extends BlockModel {
  _previousStepParams: any; // 上一次持久化的 stepParams，用于 preview 时回滚

  renderComponent() {
    const { content } = this.props;
    return content;
  }
}

MarkdownBlockModel.define({
  label: tExpr('Markdown'),
});

MarkdownBlockModel.registerFlow(editMarkdownFlow);
