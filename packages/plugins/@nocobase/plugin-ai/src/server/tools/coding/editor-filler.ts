/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { z } from 'zod';
import { ToolOptions } from '../../manager/tool-manager';

export const editorFiller: ToolOptions = {
  name: 'editorFiller',
  title: '{{t("Editor filler")}}',
  description: '{{t("Fill ai generated source code to the code editor")}}',
  execution: 'frontend',
  schema: z.object({
    code: z.string().describe('ai generated source code'),
  }),
  invoke: async () => {
    return {
      status: 'success',
      content: 'I have filled the code editor with the provided source code.',
    };
  },
};
