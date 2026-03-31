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
import { WorkContext, WorkContextBackgroundStrategy, WorkContextResolveStrategy } from '../types';
import resource from '../ai-employees/built-in/ai-coding/document/basic/flow-resource';
import jsBlock from '../ai-employees/built-in/ai-coding/document/js-block';
import jsField from '../ai-employees/built-in/ai-coding/document/js-field';
import jsColumn from '../ai-employees/built-in/ai-coding/document/js-column';
import jsItem from '../ai-employees/built-in/ai-coding/document/js-item';
import jsAction from '../ai-employees/built-in/ai-coding/document/js-action';
import jsColumnExample from '../ai-employees/built-in/ai-coding/document/example/js-column';
import jsFilterExample from '../ai-employees/built-in/ai-coding/document/example/js-filter';

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

  provideWorkContextBackgroundStrategy(): WorkContextBackgroundStrategy {
    return async (_ctx, _aiMessages, workContext) => {
      const document: { name: string; content: string }[] = [resource];
      const sceneSet = new Set(workContext.map((item) => item.content as Content).map((content) => content.scene));
      if (sceneSet.has('block')) {
        document.push(jsBlock);
        document.push(...jsFilterExample['en-US']);
      }
      if (sceneSet.has('detail')) {
        document.push(jsField);
      }
      if (sceneSet.has('form')) {
        document.push(jsItem);
        document.push(jsAction);
      }

      if (sceneSet.has('table')) {
        document.push(jsColumn);
        document.push(...jsColumnExample['en-US']);
        document.push(jsAction);
      }

      return document.map((doc) => String.raw`<document name="${doc.name}">\n${doc.content}\n</document>`).join('\n');
    };
  }
}
