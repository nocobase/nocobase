/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createSafeDocument, createSafeWindow, escapeT } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { CodeEditor } from '../../components/code-editor';
import { ActionSceneEnum, RecordActionModel } from '../base';

export class JSRecordActionModel extends RecordActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    type: 'link',
    title: escapeT('JS action'),
  };
}

JSRecordActionModel.define({
  label: escapeT('JS action'),
  sort: 9999,
});

JSRecordActionModel.registerFlow({
  key: 'clickSettings',
  on: 'click',
  title: escapeT('Click settings'),
  steps: {
    runJs: {
      title: escapeT('Write JavaScript'),
      uiSchema: {
        code: {
          type: 'string',
          'x-component': CodeEditor,
          'x-component-props': {
            minHeight: '320px',
            theme: 'light',
            enableLinter: true,
          },
        },
      },
      uiMode: {
        type: 'dialog',
        props: {
          width: '70%',
        },
      },
      defaultParams(ctx) {
        return {
          code: `
if (!ctx.record) {
  ctx.message.error('未获取到记录');
} else {
  ctx.message.success('记录ID：' + (ctx.filterByTk ?? ctx.record?.id));
}
`,
        };
      },
      async handler(ctx, params) {
        const { code = '' } = params || {};
        await ctx.runjs(code, { window: createSafeWindow(), document: createSafeDocument() });
      },
    },
  },
});
