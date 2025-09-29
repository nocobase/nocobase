/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene, defineAction, escapeT } from '@nocobase/flow-engine';
import { CodeEditor } from '../components/code-editor';

export const runjs = defineAction({
  name: 'runjs',
  title: escapeT('Execute JavaScript'),
  scene: [ActionScene.DYNAMIC_EVENT_FLOW],
  uiSchema: {
    code: {
      type: 'string',
      'x-component': CodeEditor,
      'x-component-props': {
        enableLinter: true,
        height: '200px',
        mode: 'runtime',
      },
    },
  },
  async handler(ctx, params) {
    // 如果是 URL 触发的，则不执行代码
    if (ctx.inputArgs?.navigation) return;

    ctx.runjs(params.code);
  },
});
