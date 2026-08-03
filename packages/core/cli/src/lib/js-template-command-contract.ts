/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const JS_TEMPLATE_CLI_COMMAND_CONTRACT = {
  canonicalWorkspaceTopic: 'js-template',
  legacyWorkspaceTopic: 'light',
  workspaceCommands: ['pull', 'check', 'save'],
  canonicalApiModule: 'js-template',
  legacyApiModule: 'light-extension',
} as const;

export interface JsTemplateWorkspaceApiPaths {
  entryGet: string;
  filesPull: string;
  compileWorkspacePreview: string;
  filesSaveSource: string;
}

export const JS_TEMPLATE_WORKSPACE_API_PATHS: JsTemplateWorkspaceApiPaths = {
  entryGet: '/jsTemplateEntries:get',
  filesPull: '/jsTemplateFiles:pull',
  compileWorkspacePreview: '/jsTemplates:compileWorkspacePreview',
  filesSaveSource: '/jsTemplateFiles:saveSource',
};

/** Legacy paths remain available so `nb light` also works with servers that predate the canonical HTTP aliases. */
export const LEGACY_LIGHT_EXTENSION_WORKSPACE_API_PATHS: JsTemplateWorkspaceApiPaths = {
  entryGet: '/lightExtensionEntries:get',
  filesPull: '/lightExtensionFiles:pull',
  compileWorkspacePreview: '/lightExtensions:compileWorkspacePreview',
  filesSaveSource: '/lightExtensionFiles:saveSource',
};
