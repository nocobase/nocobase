/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionTreeEntryInput } from './types';

export const DEFAULT_JS_PAGE_TEMPLATE_FILES: readonly LightExtensionTreeEntryInput[] = [
  {
    path: 'src/client/js-pages/hello-page/index.tsx',
    content: `import type { JSPageContext, RunJSContext } from '@nocobase/light-extension-sdk/client';
import type { Settings } from 'light-extension:settings/client/js-page/hello-page';

const pageContext: RunJSContext & JSPageContext<Settings> = ctx;
const { Button, Card, Space, Typography } = ctx.libs.antd;
const settings = ctx.settings;
const title = ctx.t(String(settings.title || 'Hello from a JS Page'));
const details = ctx.t(String(settings.details || 'This page is rendered by a light extension.'));

const refreshPage = async () => {
  await ctx.page.refresh();
};

ctx.render(
  <Card title={title}>
    <Space direction="vertical">
      {settings.showDetails !== false ? <Typography.Text>{details}</Typography.Text> : null}
      <Button onClick={refreshPage} type="primary">
        {ctx.t('Refresh page')}
      </Button>
    </Space>
  </Card>,
);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-pages/hello-page/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "hello-page",
  "title": "Hello page",
  "description": "A configurable JS Page rendered by a light extension.",
  "category": "js-page",
  "tags": ["JS Page", "Example"],
  "sort": 10,
  "settings": {
    "title": {
      "type": "string",
      "title": "Page title",
      "default": "Hello from a JS Page",
      "required": true,
      "x-component": "Input"
    },
    "showDetails": {
      "type": "boolean",
      "title": "Show details",
      "default": true,
      "x-component": "Switch"
    },
    "details": {
      "type": "string",
      "title": "Details",
      "default": "This page is rendered by a light extension.",
      "x-component": "Input.TextArea",
      "x-visible-when": { "path": "showDetails", "operator": "$eq", "value": true }
    }
  }
}
`,
    language: 'json',
  },
];
