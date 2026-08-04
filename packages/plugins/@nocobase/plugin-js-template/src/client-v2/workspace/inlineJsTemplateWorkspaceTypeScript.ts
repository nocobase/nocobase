/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSWorkspaceTypeScriptContextResolver } from '@nocobase/client-v2';
import { createActiveTemplateContextType, generateInlineClientSettingsTypes } from '@nocobase/js-template-sdk/typegen';

import type { JsTemplateKind } from '../../constants';

export function createInlineJsTemplateWorkspaceTypeScriptContextResolver(
  kind: JsTemplateKind,
): RunJSWorkspaceTypeScriptContextResolver {
  return (activePath, files) => {
    const settingsTypegen = generateInlineClientSettingsTypes({ files, kind });
    const activeEntryContext = createActiveTemplateContextType({
      activePath,
      templates: settingsTypegen.templates,
    });
    if (!activeEntryContext.file || !activeEntryContext.globalContextType) {
      return undefined;
    }

    return {
      declarationFiles: [...settingsTypegen.files, activeEntryContext.file],
      globalContextType: activeEntryContext.globalContextType,
    };
  };
}
