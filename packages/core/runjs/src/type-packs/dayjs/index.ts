/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSTypeLibraryPackDefinition } from '../generator';

export const RUNJS_TYPESCRIPT_DAYJS_BRIDGE_PATH = '/__runjs__/type-packs/dayjs-bridge.d.ts';

export const RUNJS_TYPESCRIPT_DAYJS_BRIDGE_DECLARATION = `
type RunJSOfficialDayjsModule = typeof import('dayjs');
interface RunJSDayjsLibrary extends RunJSOfficialDayjsModule {}
`;

export const RUNJS_DAYJS_PLUGIN_POLICY = {
  kind: 'base-only',
  preinstalledPlugins: [] as const,
  description:
    'RunJS exposes the base dayjs entry. Plugin APIs are excluded because the FlowEngine runtime does not install plugins on its dayjs import.',
} as const;

export const RUNJS_DAYJS_TYPE_LIBRARY_PACK_DEFINITION = {
  id: 'dayjs',
  libraryName: 'dayjs',
  entry: 'dayjs',
  rootFiles: [
    {
      path: RUNJS_TYPESCRIPT_DAYJS_BRIDGE_PATH,
      content: RUNJS_TYPESCRIPT_DAYJS_BRIDGE_DECLARATION,
    },
  ],
  triggers: ['dayjs'],
  metadata: {
    pluginPolicy: RUNJS_DAYJS_PLUGIN_POLICY.kind,
  },
} satisfies RunJSTypeLibraryPackDefinition;
