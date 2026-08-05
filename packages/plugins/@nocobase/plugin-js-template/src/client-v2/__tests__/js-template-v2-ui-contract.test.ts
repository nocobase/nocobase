/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { JS_TEMPLATE_SOURCE_BINDING_TYPE, JS_TEMPLATE_SOURCE_MODE } from '../../constants';
import pluginEnUS from '../../locale/en-US.json';
import pluginZhCN from '../../locale/zh-CN.json';
import { DEFAULT_JS_PAGE_TEMPLATE_FILES } from '../../shared/default-template-js-pages';
import { isJsTemplateRuntimeSourceBinding } from '../../shared/jsTemplateRunJSPersistence';
import {
  JSActionJsTemplateSourceField,
  JSBlockJsTemplateSourceField,
} from '../components/JSBlockJsTemplateSourceField';
import { JsTemplateCreateSourceSelector as DirectJsTemplateCreateSourceSelector } from '../components/JsTemplateCreateSourceSelector';
import { createJsTemplateRunJSEditorProvider as directCreateJsTemplateRunJSEditorProvider } from '../components/RunJSJsTemplateEditorProvider';
import { SaveAsJsTemplate as DirectSaveAsJsTemplate } from '../components/SaveAsJsTemplate';
import { JsTemplateCredentialInput as DirectJsTemplateCredentialInput } from '../components/JsTemplateSecretVariableInput';
import { JsTemplateSyncDrawer as DirectJsTemplateSyncDrawer } from '../components/JsTemplateSyncDrawer';
import { useJsTemplateCreateJobs as directUseJsTemplateCreateJobs } from '../hooks/useJsTemplateCreateJobs';
import { useJsTemplateProject as directUseJsTemplateProject } from '../hooks/useJsTemplateProject';
import { useJsTemplateSync as directUseJsTemplateSync } from '../hooks/useJsTemplateSync';
import {
  createJsTemplateRunJSEditorProvider as exportedCreateJsTemplateRunJSEditorProvider,
  JSActionJsTemplateSourceField as ExportedJSActionJsTemplateSourceField,
  JSBlockJsTemplateSourceField as ExportedJSBlockJsTemplateSourceField,
  JsTemplateCreateSourceSelector as ExportedJsTemplateCreateSourceSelector,
  JsTemplateCredentialInput as ExportedJsTemplateCredentialInput,
  JsTemplateCatalogPage as ExportedJsTemplateCatalogPage,
  JsTemplateProjectsPage as ExportedJsTemplateProjectsPage,
  JsTemplateSyncDrawer as ExportedJsTemplateSyncDrawer,
  JsTemplateWorkspacePage as ExportedJsTemplateWorkspacePage,
  SaveAsJsTemplate as ExportedSaveAsJsTemplate,
  PluginJsTemplateClientV2 as ExportedPluginJsTemplateClientV2,
  useJsTemplateCreateJobs as exportedUseJsTemplateCreateJobs,
  useJsTemplateProject as exportedUseJsTemplateProject,
  useJsTemplateSync as exportedUseJsTemplateSync,
} from '../index';
import { JS_TEMPLATE_V2_UI_CONTRACT } from '../jsTemplateV2UIContract';
import DirectJsTemplateCatalogPage from '../pages/JsTemplateCatalogPage';
import DirectJsTemplateProjectsPage from '../pages/JsTemplateProjectsPage';
import DirectJsTemplateWorkspacePage from '../pages/JsTemplateWorkspacePage';
import { PluginJsTemplateClientV2 as DirectPluginJsTemplateClientV2 } from '../plugin';

const pluginCanonicalTranslations = {
  'Compiling JS Template': '正在编译 JS 模板',
  'Connect this Source Project to a Git repository to sync its code.': '将此源码项目连接到 Git 仓库以同步代码。',
  'Copy selected JS Template code': '复制所选 JS 模板代码',
  'Copying JS Template code': '正在复制 JS 模板代码',
  'Create JS Template': '创建 JS 模板',
  'Create new JS Template': '创建新 JS 模板',
  'Create Source Project': '创建源码项目',
  'Edit Source Project': '编辑源码项目',
  'Existing JS Template': '已有 JS 模板',
  'Failed to move source to JS Template': '移入 JS 模板失败',
  'JS Template': 'JS 模板',
  'JS Template creation failed': 'JS 模板创建失败',
  'JS Template name': 'JS 模板名称',
  'JS Template request failed': 'JS 模板请求失败',
  'JS Templates': 'JS 模板',
  'Loading JS Template': '正在加载 JS 模板',
  'Move to JS Template': '移入 JS 模板',
  'Moved to JS Template': '已移入 JS 模板',
  'No JS Templates': '没有可用的 JS 模板',
  'No JS Templates yet': '暂无 JS 模板',
  'Other JS Templates are read-only here': '此编辑器中其他 JS 模板为只读',
  'Remote code can be pulled into this Source Project.': '可以将远端代码拉取到此源码项目。',
  'Select a JS Template': '请选择 JS 模板',
  'Select a JS Template to configure settings': '请选择 JS 模板后配置',
  'Select a Source Project from Source Projects': '请从源码项目列表选择源码项目',
  'Selected JS Template is unavailable': '所选 JS 模板不可用',
  'The current working copy of this template and its referenced files will be copied to inline code. The JS Template will remain unchanged.':
    '将把当前模板的工作副本及其实际引用的文件复制到内联代码；原 JS 模板保持不变。',
  'The saved sync source will be removed from this Source Project.': '将从此源码项目中移除已保存的同步来源。',
  'This page is rendered by a JS Template.': '此页面由 JS 模板渲染。',
  'You can copy the selected JS Template code into the inline editor, or keep the existing inline code.':
    '你可以将所选 JS 模板代码复制到内联编辑器，也可以保留现有内联代码。',
} as const;

const coreCanonicalTranslations = {
  'Ask an administrator for permission to use this JS Template.': '请联系管理员授予使用此 JS 模板的权限。',
  'Configure required JS Template settings': '请继续配置 JS 模板必填项',
  'Enable the JS Templates plugin to edit this source binding.': '启用 JS 模板插件后才能编辑该源码绑定。',
  'Failed to load JS Templates': '加载 JS 模板失败',
  'JS Template': 'JS 模板',
  'JS Template access denied': 'JS 模板访问被拒绝',
  'JS Template binding is outdated': 'JS 模板绑定已过期',
  'JS Template missing': 'JS 模板不存在',
  'JS Template project missing': 'JS 模板项目不存在',
  'JS Template "{{templateId}}" setting "{{propertyPath}}" has an invalid x-visible-when condition: {{reason}}':
    'JS 模板 "{{templateId}}" 的配置 "{{propertyPath}}" 包含无效的 x-visible-when 条件：{{reason}}',
  'JS Template project is archived': 'JS 模板项目已归档',
  'JS Template settings are invalid': 'JS 模板配置无效',
  'JS Template source': 'JS 模板源码',
  'JS Template source is unavailable': 'JS 模板源码不可用',
  'Loading JS Templates': '正在加载 JS 模板',
  'No JS Templates': '没有可用的 JS 模板',
  'Open the action settings and fix the JS Template settings.': '请打开操作设置并修复 JS 模板配置。',
  'Open the block settings and fix the JS Template settings.': '请打开区块设置并修复 JS 模板配置。',
  'Open the field settings and fix the JS Template settings.': '请打开字段设置并修复 JS 模板配置。',
  'Open the item settings and fix the JS Template settings.': '请打开项设置并修复 JS 模板配置。',
  'Open the page settings and fix the JS Template settings.': '请打开页面设置并修复 JS 模板配置。',
  'Search JS Templates': '搜索 JS 模板',
  'Select a JS Template': '请选择 JS 模板',
} as const;

function readLocale(filePath: string): Record<string, string> {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, string>;
}

function collectProductionSources(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : collectProductionSources(entryPath);
    }
    return /\.tsx?$/u.test(entry.name) ? [entryPath] : [];
  });
}

describe('JS Templates client-v2 UI contract', () => {
  it('exports the canonical client-v2 implementation', () => {
    expect(ExportedPluginJsTemplateClientV2).toBe(DirectPluginJsTemplateClientV2);
    expect(ExportedJsTemplateCatalogPage).toBe(DirectJsTemplateCatalogPage);
    expect(ExportedJsTemplateProjectsPage).toBe(DirectJsTemplateProjectsPage);
    expect(ExportedJsTemplateWorkspacePage).toBe(DirectJsTemplateWorkspacePage);
    expect(ExportedJSActionJsTemplateSourceField).toBe(JSActionJsTemplateSourceField);
    expect(ExportedJSBlockJsTemplateSourceField).toBe(JSBlockJsTemplateSourceField);
    expect(ExportedSaveAsJsTemplate).toBe(DirectSaveAsJsTemplate);
    expect(ExportedJsTemplateCreateSourceSelector).toBe(DirectJsTemplateCreateSourceSelector);
    expect(ExportedJsTemplateCredentialInput).toBe(DirectJsTemplateCredentialInput);
    expect(ExportedJsTemplateSyncDrawer).toBe(DirectJsTemplateSyncDrawer);
    expect(exportedUseJsTemplateCreateJobs).toBe(directUseJsTemplateCreateJobs);
    expect(exportedUseJsTemplateProject).toBe(directUseJsTemplateProject);
    expect(exportedUseJsTemplateSync).toBe(directUseJsTemplateSync);
    expect(exportedCreateJsTemplateRunJSEditorProvider).toBe(directCreateJsTemplateRunJSEditorProvider);
  });

  it('keeps canonical product copy complete in en-US and zh-CN', () => {
    const coreEnUS = readLocale(path.resolve(process.cwd(), 'packages/core/client/src/locale/en-US.json'));
    const coreZhCN = readLocale(path.resolve(process.cwd(), 'packages/core/client/src/locale/zh-CN.json'));

    for (const [key, zhCN] of Object.entries(pluginCanonicalTranslations)) {
      expect(pluginEnUS[key]).toBe(key);
      expect(pluginZhCN[key]).toBe(zhCN);
    }
    for (const [key, zhCN] of Object.entries(coreCanonicalTranslations)) {
      expect(coreEnUS[key]).toBe(key);
      expect(coreZhCN[key]).toBe(zhCN);
    }
    expect(pluginZhCN[JS_TEMPLATE_V2_UI_CONTRACT.productNameKey]).toBe(JS_TEMPLATE_V2_UI_CONTRACT.productNameZhCN);
    const defaultJsPageSource = DEFAULT_JS_PAGE_TEMPLATE_FILES.map((file) => file.content).join('\n');
    expect(defaultJsPageSource).toContain('This page is rendered by a JS Template.');
  });

  it('uses only canonical persisted identities and keeps client-v2 independent from client-v1', () => {
    expect(JS_TEMPLATE_SOURCE_MODE).toBe('js-template');
    expect(JS_TEMPLATE_SOURCE_BINDING_TYPE).toBe('js-template-entry');
    expect(
      isJsTemplateRuntimeSourceBinding({
        type: 'js-template-entry',
        projectId: 'project_1',
        templateId: 'template_1',
        kind: 'js-block',
      }),
    ).toBe(true);
    expect(
      isJsTemplateRuntimeSourceBinding({
        type: 'js-template-entry',
        projectId: 'project_1',
        templateId: 'template_1',
        kind: 'js-block',
        projectTitle: 'Display-only field',
      }),
    ).toBe(false);

    const sourceFiles = [
      ...collectProductionSources(path.resolve(__dirname, '..')),
      ...collectProductionSources(path.resolve(process.cwd(), 'packages/core/client-v2/src/flow')),
    ];
    const legacyClientImports: string[] = [];
    for (const file of sourceFiles) {
      const source = fs.readFileSync(file, 'utf8');
      if (/(?:from\s+|import\s*\()['"]@nocobase\/client(?:['"/])/u.test(source)) {
        legacyClientImports.push(path.relative(process.cwd(), file));
      }
    }

    expect(legacyClientImports).toEqual([]);
  });
});
