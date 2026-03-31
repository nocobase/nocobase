/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem } from '@nocobase/flow-engine';
import React from 'react';
import _ from 'lodash';
import { CommonItemModel } from '../base';
import { editMarkdownFlow } from '../../flows/editMarkdownFlow';

const MarkdownRenderer = ({ ctx, raw, record }) => {
  const [html, setHtml] = React.useState(null);

  React.useEffect(() => {
    let canceled = false;

    const run = async () => {
      try {
        // Liquid 渲染
        const liquid = await ctx.liquid.renderWithFullContext(raw, ctx);

        // Markdown 渲染
        const md = await ctx.markdown.render(liquid, {
          textOnly: false,
        });

        if (!canceled) setHtml(md);
      } catch (err) {
        if (!canceled) {
          setHtml(`<pre>渲染失败: ${err}</pre>`);
        }
      }
    };

    run();

    return () => {
      canceled = true;
    };
  }, [raw, record]);
  return html;
};

export class MarkdownItemModel extends CommonItemModel {
  _previousStepParams: any; // 上一次持久化的 stepParams，用于 preview 时回滚

  render() {
    const record = this.context.record;
    const rawContent = this.props.value;

    return (
      <FormItem shouldUpdate showLabel={false}>
        <MarkdownRenderer ctx={this.context} raw={rawContent} record={record} />
      </FormItem>
    );
  }
}

MarkdownItemModel.registerFlow(editMarkdownFlow);

MarkdownItemModel.define({
  label: '{{t("Markdown")}}',
});
