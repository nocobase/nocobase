/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayTextFieldModel } from '@nocobase/client-v2';
import { Space, Typography } from 'antd';
import React from 'react';

import { tExpr } from './locale';

const PATCH_FLAG = Symbol.for('nocobase.plugin-text-copy.DisplayTextFieldModel.patched');

type TextCopyDisplayTextFieldModel = DisplayTextFieldModel & {
  props?: DisplayTextFieldModel['props'] & {
    displayCopyButton?: boolean;
  };
};

const TextWithCopyButton = (props: { children: React.ReactNode; copyText: string }) => {
  const { children, copyText } = props;
  const [hovered, setHovered] = React.useState(false);

  return (
    <span onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Space size="small">
        {children}
        {hovered ? <Typography.Text copyable={{ text: copyText }} /> : null}
      </Space>
    </span>
  );
};

export function registerTextCopyDisplayField() {
  DisplayTextFieldModel.registerFlow({
    key: 'textCopySettings',
    title: tExpr('Display Field settings'),
    sort: 210,
    steps: {
      displayCopyButton: {
        title: tExpr('Display copy button'),
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

  const prototype = DisplayTextFieldModel.prototype as DisplayTextFieldModel & Record<symbol, unknown>;
  if (prototype[PATCH_FLAG]) {
    return;
  }

  const renderComponent = prototype.renderComponent;
  prototype.renderComponent = function renderTextWithCopy(
    this: TextCopyDisplayTextFieldModel,
    value: string | undefined | null,
    wrap?: boolean,
  ) {
    const content = renderComponent.call(this, value, wrap);
    const copyText = this.t(value);

    if (!this.props?.displayCopyButton || copyText === undefined || copyText === null || copyText === '') {
      return content;
    }

    return <TextWithCopyButton copyText={String(copyText)}>{content}</TextWithCopyButton>;
  };
  prototype[PATCH_FLAG] = true;
}
