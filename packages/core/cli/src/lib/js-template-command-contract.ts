/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const JS_TEMPLATE_CLI_COMMAND_CONTRACT = {
  workspaceTopic: 'js-template',
  workspaceCommands: ['pull', 'check', 'save'],
  apiModule: 'js-template',
} as const;

export interface JsTemplateWorkspaceApiPaths {
  templateGet: string;
  filesPull: string;
  compileWorkspacePreview: string;
  filesSaveSource: string;
}

export const JS_TEMPLATE_WORKSPACE_API_PATHS: JsTemplateWorkspaceApiPaths = {
  templateGet: '/jsTemplates:get',
  filesPull: '/jsTemplateFiles:pull',
  compileWorkspacePreview: '/jsTemplates:compileWorkspacePreview',
  filesSaveSource: '/jsTemplateFiles:saveSource',
};
