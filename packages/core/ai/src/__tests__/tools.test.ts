/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { ToolsLoader } from '../loader';
import path from 'path';
import { AIManager } from '../ai-manager';
import { ToolsManager } from '../tools-manager';

describe('Tools loader test cases', () => {
  const basePath = path.resolve(__dirname, 'resource', 'ai');
  let app: MockServer;
  let aiManager: AIManager;
  let toolsManager: ToolsManager;
  let loader: ToolsLoader;

  beforeEach(async () => {
    app = await createMockServer();
    aiManager = app.aiManager;
    toolsManager = aiManager.toolsManager;
    loader = new ToolsLoader(aiManager, {
      scan: { basePath, pattern: ['**/tools/**/*.ts', '**/tools/**/*/description.md'] },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should load tools file in tools root directory ', async () => {
    await loader.load();
    const tools = await toolsManager.getTools('print');
    expect(tools).toBeDefined();
    expect(tools.definition.name).eq('print');
    expect(tools.definition.description).eq('print tools');
    expect(await tools.invoke(null, null, null)).toEqual({ status: 'success' });
  });

  it('should load tools directory in tools root directory ', async () => {
    await loader.load();
    const tools = await toolsManager.getTools('hallow');
    expect(tools).toBeDefined();
    expect(tools.definition.name).eq('hallow');
    expect(tools.definition.description).eq('hallow tools');
    expect(await tools.invoke(null, null, null)).toEqual({ status: 'success' });
  });

  it('should load description markdown file in tools directory ', async () => {
    await loader.load();
    const tools = await toolsManager.getTools('desc');
    expect(tools).toBeDefined();
    expect(tools.definition.name).eq('desc');
    expect(tools.definition.description).eq('# DESC\n');
    expect(await tools.invoke(null, null, null)).toEqual({ status: 'success' });
    expect(await tools.invoke(null, null, null)).toEqual({ status: 'success' });
  });

  it('should load tools file in skills directory ', async () => {
    await loader.load();
    const tools = await toolsManager.getTools('read');
    expect(tools).toBeDefined();
    expect(tools.definition.name).eq('read');
    expect(tools.definition.description).eq('read document');
    expect(await tools.invoke(null, null, null)).toEqual({ status: 'success' });
  });

  it.skip('should load tools directory in skills directory ', async () => {
    await loader.load();
    const tools = await toolsManager.getTools('search');
    expect(tools).toBeDefined();
    expect(tools.definition.name).eq('search');
    expect(tools.definition.description).eq('# SEARCH\n');
    expect(await tools.invoke(null, null, null)).toEqual({ status: 'success' });
  });

  it('should load tools when tools in directory for grouping', async () => {
    await loader.load();
    const group1 = await toolsManager.getTools('group1');
    expect(group1).toBeDefined();
    expect(group1.definition.name).eq('group1');
    expect(group1.definition.description).eq('hallow group1');
    expect(await group1.invoke(null, null, null)).toEqual({ status: 'success' });

    const group2 = await toolsManager.getTools('group2');
    expect(group2).toBeDefined();
    expect(group2.definition.name).eq('group2');
    expect(group2.definition.description).eq('hallow group2');
    expect(await group2.invoke(null, null, null)).toEqual({ status: 'success' });

    const group3 = await toolsManager.getTools('group3');
    expect(group3).toBeDefined();
    expect(group3.definition.name).eq('group3');
    expect(group3.definition.description).eq('# GROUP3\n');
    expect(await group3.invoke(null, null, null)).toEqual({ status: 'success' });
  });

  it('should ignore tools which not export default', async () => {
    await loader.load();
    const tools = await toolsManager.getTools('ignored');
    expect(tools).toBeUndefined();
  });
});
