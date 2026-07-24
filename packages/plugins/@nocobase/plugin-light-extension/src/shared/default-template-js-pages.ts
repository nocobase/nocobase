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
import { getPageDetails } from './page-details';

const pageContext: RunJSContext & JSPageContext<Settings> = ctx;
const { Button, Card, Space, Typography } = ctx.libs.antd;
const settings = pageContext.settings;
const refresh = async () => {
  await pageContext.page.refresh();
};

ctx.render(
  <Card title={ctx.t(String(settings.title || 'Hello from a JS Page'))}>
    <Space direction="vertical">
      {settings.showDetails !== false ? <Typography.Text>{ctx.t(getPageDetails(settings))}</Typography.Text> : null}
      <Button onClick={refresh}>{ctx.t('Refresh page')}</Button>
    </Space>
  </Card>,
);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-pages/hello-page/page-details.ts',
    content: `import type { Settings } from 'light-extension:settings/client/js-page/hello-page';

export function getPageDetails(settings: Settings): string {
  return String(settings.details || 'This page is rendered by a light extension.');
}
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-pages/hello-page/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "hello-page",
  "title": "Hello page",
  "description": "Minimal JS Page with a local helper import and refresh action.",
  "category": "js-page",
  "tags": ["JS Page"],
  "sort": 10,
  "settings": {
    "title": { "type": "string", "title": "Page title", "default": "Hello from a JS Page", "required": true, "x-component": "Input" },
    "showDetails": { "type": "boolean", "title": "Show details", "default": true, "x-component": "Switch" },
    "details": { "type": "string", "title": "Details", "default": "This page is rendered by a light extension.", "x-component": "Input.TextArea", "x-visible-when": { "path": "showDetails", "operator": "$eq", "value": true } }
  }
}
`,
    language: 'json',
  },
];
