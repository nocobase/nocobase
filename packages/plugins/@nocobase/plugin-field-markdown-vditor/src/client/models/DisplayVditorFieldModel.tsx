/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel, escapeT } from '@nocobase/flow-engine';
import { DisplayTitleFieldModel, tval } from '@nocobase/client';
import React, { useState, useEffect } from 'react';

const Display = ({ value, markdown, liquid, t, textOnly, ctx }) => {
  const [content, setContent] = useState(null);

  useEffect(() => {
    if (!value) return;

    (async () => {
      try {
        const result = await liquid.renderWithFullContext(value, ctx);
        const html = markdown.render(t(result), { ellipsis: textOnly });
        setContent(html);
      } catch (err) {
        setContent(`<pre style="color:red;"> 渲染错误: ${err.message}</pre>`);
      }
    })();
  }, [value, textOnly]);

  return content;
};

export class DisplayVditorFieldModel extends DisplayTitleFieldModel {
  public renderComponent(value) {
    if (!value) return null;
    const { markdown, liquid, t } = this.context;
    const { textOnly } = this.props;
    return <Display value={value} markdown={markdown} liquid={liquid} t={t} textOnly={textOnly} ctx={this.context} />;
  }
}

DisplayVditorFieldModel.define({
  label: escapeT('MarkdownVditor'),
});

DisplayVditorFieldModel.registerFlow({
  key: 'markdownVditorSettings',
  title: tval('Content settings'),
  sort: 200,
  steps: {
    renderMode: {
      use: 'renderMode',
    },
  },
});

DisplayItemModel.bindModelToInterface('DisplayVditorFieldModel', ['vditor'], { isDefault: true });
