/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import type { CodeEditorExtra, CodeEditorExtraRegistry, EditorRef } from '../types';

export class CodeEditorExtension {
  private static rightExtras = new Registry<CodeEditorExtra>();

  static registerRightExtra(options: CodeEditorExtraRegistry) {
    CodeEditorExtension.rightExtras.register(options.name, options.extra);
  }

  static getRightExtras(): CodeEditorExtra[] {
    return Array.from(CodeEditorExtension.rightExtras.getValues());
  }
}
