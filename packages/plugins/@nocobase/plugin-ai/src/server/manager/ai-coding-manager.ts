/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginAIServer from '../plugin';
import type { Context } from '@nocobase/actions';
import { WorkContext, WorkContextResolveStrategy } from '../types';

type Content = {
  scene: string;
  language: string;
  code: string;
};

export class AICodingManager {
  constructor(protected plugin: PluginAIServer) {}

  provideWorkContextResolveStrategy(): WorkContextResolveStrategy {
    return async (ctx: Context, contextItem: WorkContext) => {
      const { scene, language, code } = contextItem.content as Content;
      return String.raw`The following is the code of the "${scene}" component\n\n\`\`\`${language}\n${code}\n\`\`\``;
    };
  }
}
