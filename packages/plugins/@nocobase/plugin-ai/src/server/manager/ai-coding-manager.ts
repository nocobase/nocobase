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
    return async (ctx, aiMessages, workContext) => {
      const document: { name: string; content: string }[] = [resource];
      const sceneSet = new Set(workContext.map((item) => item.content as Content).map((content) => content.scene));
      if (sceneSet.has('JSBlockModel')) {
        document.push(jsBlock);
      }
      if (sceneSet.has('JSItemModel')) {
        document.push(jsItem);
      }
      if (sceneSet.has('JSFieldModel')) {
        document.push(jsField);
      }
      if (sceneSet.has('JSColumnModel')) {
        document.push(jsColumn);
      }
      if (
        sceneSet.has('JSFormActionModel') ||
        sceneSet.has('JSRecordActionModel') ||
        sceneSet.has('JSCollectionActionModel')
      ) {
        document.push(jsAction);
      }

      return document.map((doc) => String.raw`<document name="${doc.name}">\n${doc.content}\n</document>`).join('\n');
    };
  }
}
