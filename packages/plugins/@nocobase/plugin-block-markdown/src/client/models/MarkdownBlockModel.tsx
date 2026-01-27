/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockModel, css, editMarkdownFlow } from '@nocobase/client';
import { escapeT } from '@nocobase/flow-engine';

export class MarkdownBlockModel extends BlockModel {
  _previousStepParams: any; // 上一次持久化的 stepParams，用于 preview 时回滚

  renderComponent() {
    const { content } = this.props;
    return content;
  }
}

MarkdownBlockModel.define({
  label: escapeT('Markdown'),
});

MarkdownBlockModel.registerFlow(editMarkdownFlow);
