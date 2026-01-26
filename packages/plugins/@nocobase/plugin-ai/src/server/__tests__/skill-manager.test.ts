/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SkillManager, RuntimeContextInfo } from '../skills/skill-manager';
import { getContextEnvs, getContextApis } from '../skills/context-skills';

describe('SkillManager', () => {
  let skillManager: SkillManager;

  beforeEach(() => {
    skillManager = new SkillManager();
  });

  describe('context data management', () => {
    it('should start with null context data', () => {
      expect(skillManager.getContextData()).toBeNull();
    });

    it('should set and get context data', () => {
      const testData: RuntimeContextInfo = {
        apis: { message: { description: 'Message API' } },
        envs: { block: { label: 'Test Block' } },
      };
      skillManager.setContextData(testData);
      expect(skillManager.getContextData()).toEqual(testData);
    });

    it('should clear context data', () => {
      skillManager.setContextData({ apis: {}, envs: {} });
      skillManager.clearContextData();
      expect(skillManager.getContextData()).toBeNull();
    });
  });
});

describe('getContextEnvs', () => {
  let skillManager: SkillManager;

  beforeEach(() => {
    skillManager = new SkillManager();
  });

  it('should return error when context not initialized', () => {
    const result = JSON.parse(getContextEnvs(skillManager));
    expect(result.error).toContain('not initialized');
  });

  it('should return error when no envs available', () => {
    skillManager.setContextData({ apis: {} });
    const result = JSON.parse(getContextEnvs(skillManager));
    expect(result.error).toContain('No environment variables');
  });

  it('should return all envs', () => {
    const envs = {
      block: { label: 'JS Block', uid: 'block-123' },
      flowModel: { modelName: 'FormBlockModel' },
      currentViewBlocks: [{ uid: 'b1', label: 'Table' }],
    };
    skillManager.setContextData({ envs });

    const result = JSON.parse(getContextEnvs(skillManager));
    expect(result).toEqual(envs);
  });
});

describe('getContextApis', () => {
  let skillManager: SkillManager;
  let mockContextData: RuntimeContextInfo;

  beforeEach(() => {
    skillManager = new SkillManager();

    mockContextData = {
      apis: {
        message: {
          description: 'Ant Design global message API',
          properties: {
            info: {
              type: 'function',
              description: 'Show an info message',
              completion: { insertText: "ctx.message.info('Info')" },
            },
            success: {
              type: 'function',
              description: 'Show a success message',
            },
          },
        },
        user: {
          title: 'Current user',
          type: 'object',
          properties: {
            id: { title: 'ID', type: 'string' },
            username: { title: 'Username', type: 'string' },
            roles: {
              title: 'Roles',
              type: 'object',
              properties: {
                name: { title: 'Role UID', type: 'string' },
              },
            },
          },
        },
      },
      envs: {},
    };

    skillManager.setContextData(mockContextData);
  });

  describe('no path (overview)', () => {
    it('should return top-level APIs summary', () => {
      const result = JSON.parse(getContextApis(skillManager));

      expect(result.message).toBeDefined();
      expect(result.message.description).toBe('Ant Design global message API');
      expect(result.message.hasProperties).toBe(true);
      expect(result.message.properties).toBeUndefined(); // Only summary

      expect(result.user).toBeDefined();
      expect(result.user.hasProperties).toBe(true);
    });

    it('should work with empty string path', () => {
      const result = JSON.parse(getContextApis(skillManager, ''));
      expect(result.message).toBeDefined();
      expect(result.user).toBeDefined();
    });
  });

  describe('with path (details)', () => {
    it('should get top-level API details', () => {
      const result = JSON.parse(getContextApis(skillManager, 'message'));

      expect(result.path).toBe('message');
      expect(result.description).toBe('Ant Design global message API');
      expect(result.properties).toBeDefined();
      expect(result.properties.info).toBeDefined();
      expect(result.properties.success).toBeDefined();
    });

    it('should get nested API details', () => {
      const result = JSON.parse(getContextApis(skillManager, 'message.info'));

      expect(result.path).toBe('message.info');
      expect(result.type).toBe('function');
      expect(result.description).toBe('Show an info message');
      expect(result.completion).toBeDefined();
    });

    it('should get deeply nested API details', () => {
      const result = JSON.parse(getContextApis(skillManager, 'user.roles'));

      expect(result.path).toBe('user.roles');
      expect(result.title).toBe('Roles');
      expect(result.properties).toBeDefined();
      expect(result.properties.name).toBeDefined();
    });

    it('should get deepest level API details', () => {
      const result = JSON.parse(getContextApis(skillManager, 'user.roles.name'));

      expect(result.path).toBe('user.roles.name');
      expect(result.title).toBe('Role UID');
      expect(result.type).toBe('string');
    });
  });

  describe('error handling', () => {
    it('should return error when context not initialized', () => {
      const emptyManager = new SkillManager();
      const result = JSON.parse(getContextApis(emptyManager));
      expect(result.error).toContain('not initialized');
    });

    it('should return error for invalid top-level path', () => {
      const result = JSON.parse(getContextApis(skillManager, 'nonexistent'));
      expect(result.error).toBeDefined();
      expect(result.availableKeys).toBeDefined();
    });

    it('should return error for invalid nested path', () => {
      const result = JSON.parse(getContextApis(skillManager, 'message.nonexistent'));
      expect(result.error).toContain('not found');
      expect(result.availableKeys).toBeDefined();
    });
  });
});
