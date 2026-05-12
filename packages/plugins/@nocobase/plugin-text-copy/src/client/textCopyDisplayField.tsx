/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayTextFieldModel } from '@nocobase/client';
import { tExpr } from '@nocobase/flow-engine';
import { Typography } from 'antd';
import React from 'react';

const NAMESPACE = 'text-copy';
const PATCH_FLAG = Symbol.for('nocobase.plugin-text-copy.DisplayTextFieldModel.patched');

export function registerTextCopyDisplayField() {
  DisplayTextFieldModel.registerFlow({
    key: 'textCopySettings',
    title: tExpr('Display Field settings'),
    sort: 210,
    steps: {
      displayCopyButton: {
        title: tExpr('Display copy button', { ns: NAMESPACE }),
        uiMode: { type: 'switch', key: 'displayCopyButton' },
        defaultParams: {
          displayCopyButton: false,
        },
        handler(ctx, params) {
          ctx.model.setProps({ displayCopyButton: params.displayCopyButton });
        },
      },
    },
  });

  const prototype = DisplayTextFieldModel.prototype as any;
  if (prototype[PATCH_FLAG]) {
    return;
  }

  const renderComponent = prototype.renderComponent;
  prototype.renderComponent = function renderTextWithCopy(value, wrap) {
    const content = renderComponent.call(this, value, wrap);
    const copyText = this.t(value);

    if (!this.props?.displayCopyButton || copyText === undefined || copyText === null || copyText === '') {
      return content;
    }

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {content}
        <Typography.Text copyable={{ text: String(copyText) }} />
      </span>
    );
  };
  prototype[PATCH_FLAG] = true;
}
