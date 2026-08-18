/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  JS_TEMPLATE_KEY_PATTERN,
  JS_TEMPLATE_SCHEMA_VERSION,
  JS_TEMPLATE_SUPPORTED_KINDS,
  type JsTemplateKind,
} from '../constants';
import type { JsTemplateTreeEntryInput } from './types';

export interface JsTemplateEntryStarterInput {
  kind: JsTemplateKind;
  templateName: string;
  title: string;
  description?: string | null;
}

const entryRoots: Record<JsTemplateKind, string> = {
  'js-block': 'src/client/js-blocks',
  'js-field': 'src/client/js-fields',
  'js-action': 'src/client/js-actions',
  'js-item': 'src/client/js-items',
};

const renderedEntrySource = `ctx.render(<span>{ctx.t('New JS Template')}</span>);
`;

const entrySources: Record<JsTemplateKind, { fileName: string; content: string }> = {
  'js-block': { fileName: 'index.tsx', content: renderedEntrySource },
  'js-field': { fileName: 'index.tsx', content: renderedEntrySource },
  'js-action': {
    fileName: 'index.ts',
    content: `ctx.message.success(ctx.t('JS Template action'));
`,
  },
  'js-item': { fileName: 'index.tsx', content: renderedEntrySource },
};

export function createJsTemplateEntryStarter(input: JsTemplateEntryStarterInput): JsTemplateTreeEntryInput[] {
  const templateName = input.templateName.trim();
  const title = input.title.trim();
  if (!JS_TEMPLATE_KEY_PATTERN.test(templateName)) {
    throw new RangeError('JS Template name must be a lowercase slug');
  }
  if (!title) {
    throw new RangeError('JS Template title is required');
  }
  if (!(JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(input.kind)) {
    throw new RangeError('JS Template kind is unsupported');
  }

  const root = `${entryRoots[input.kind]}/${templateName}`;
  const source = entrySources[input.kind];
  const descriptor = {
    schemaVersion: JS_TEMPLATE_SCHEMA_VERSION,
    key: templateName,
    title,
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
  };

  return [
    {
      path: `${root}/${source.fileName}`,
      content: source.content,
      language: 'typescript',
    },
    {
      path: `${root}/entry.json`,
      content: `${JSON.stringify(descriptor, null, 2)}\n`,
      language: 'json',
    },
  ];
}
