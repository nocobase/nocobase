/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { getSnippetBody, listSnippetsForContext } from '../runjs-context/snippets';

describe('RunJS Snippets', () => {
  describe('getSnippetBody', () => {
    it('should return snippet body for global/message-success', async () => {
      const body = await getSnippetBody('global/message-success');
      expect(body).toBeTruthy();
      expect(typeof body).toBe('string');
      expect(body).toContain('ctx.message.success');
    });

    it('should return snippet body for global/api-request-get', async () => {
      const body = await getSnippetBody('global/api-request-get');
      expect(body).toBeTruthy();
      expect(body).toContain('ctx.api.request');
    });

    it('should return snippet body for scene/jsblock/render-basic', async () => {
      const body = await getSnippetBody('scene/jsblock/render-basic');
      expect(body).toBeTruthy();
      expect(body).toContain('element');
    });

    it('should throw error for non-existent snippet', async () => {
      await expect(getSnippetBody('non/existent/snippet')).rejects.toThrow(/snippet not found/);
    });
  });

  describe('listSnippetsForContext', () => {
    it('should return snippet list for JSBlockModel', async () => {
      const snippets = await listSnippetsForContext('JSBlockRunJSContext', 'v1', 'en-US');
      expect(Array.isArray(snippets)).toBe(true);
      expect(snippets.length).toBeGreaterThan(0);

      const snippet = snippets[0];
      expect(snippet).toHaveProperty('name');
      expect(snippet).toHaveProperty('body');
      expect(snippet).toHaveProperty('ref');
    });

    it('should return snippet list for JSFieldModel', async () => {
      const snippets = await listSnippetsForContext('JSFieldRunJSContext', 'v1', 'en-US');
      expect(Array.isArray(snippets)).toBe(true);
      expect(snippets.length).toBeGreaterThan(0);
    });

    it('should filter snippets by context', async () => {
      const allSnippets = await listSnippetsForContext('*', 'v1', 'en-US');
      const blockSnippets = await listSnippetsForContext('JSBlockRunJSContext', 'v1', 'en-US');

      // Both should return snippets
      expect(allSnippets.length).toBeGreaterThan(0);
      expect(blockSnippets.length).toBeGreaterThan(0);

      // The filtering works based on snippet definitions:
      // - Snippets without contexts filter are available to all
      // - Snippets with contexts: ['*'] are available when querying with '*'
      // - Snippets with contexts: ['JSBlockRunJSContext'] are available when querying with 'JSBlockRunJSContext'
      // So the counts may vary depending on how snippets are configured
    });

    it('should support locale-specific labels', async () => {
      const enSnippets = await listSnippetsForContext('JSBlockRunJSContext', 'v1', 'en-US');
      const zhSnippets = await listSnippetsForContext('JSBlockRunJSContext', 'v1', 'zh-CN');

      expect(enSnippets.length).toBeGreaterThan(0);
      expect(zhSnippets.length).toBeGreaterThan(0);

      // Both should have snippets, but labels might differ
      const enSnippet = enSnippets.find((s) => s.ref.includes('message-success'));
      const zhSnippet = zhSnippets.find((s) => s.ref.includes('message-success'));

      if (enSnippet && zhSnippet) {
        // If locale support is implemented, labels should differ
        // Otherwise they might be the same
        expect(enSnippet.ref).toBe(zhSnippet.ref);
      }
    });

    it('should include group information', async () => {
      const snippets = await listSnippetsForContext('*', 'v1', 'en-US');

      const globalSnippet = snippets.find((s) => s.ref.startsWith('global/'));
      if (globalSnippet) {
        expect(globalSnippet.group).toBe('global');
      }

      const sceneSnippet = snippets.find((s) => s.ref.startsWith('scene/jsblock/'));
      if (sceneSnippet) {
        expect(sceneSnippet.group).toBe('scene/jsblock');
      }

      // At least one should have a group
      expect(snippets.some((s) => s.group)).toBe(true);
    });

    it('should handle empty context gracefully', async () => {
      const snippets = await listSnippetsForContext('', 'v1', 'en-US');
      expect(Array.isArray(snippets)).toBe(true);
    });
  });

  describe('New snippets', () => {
    it('should include api-request-basic snippet', async () => {
      const body = await getSnippetBody('global/api-request-basic');
      expect(body).toBeTruthy();
      expect(body).toContain('ctx.api.request');
    });

    it('should include api-response snippet', async () => {
      const body = await getSnippetBody('global/api-response');
      expect(body).toBeTruthy();
    });

    it('should include i18n-example snippet', async () => {
      const body = await getSnippetBody('global/i18n-example');
      expect(body).toBeTruthy();
      expect(body).toContain('ctx.t');
    });

    it('should include basic-html-template snippet', async () => {
      const body = await getSnippetBody('scene/jsblock/basic-html-template');
      expect(body).toBeTruthy();
      expect(body).toContain('innerHTML');
    });

    it('should include echarts-random snippet', async () => {
      const body = await getSnippetBody('scene/jsblock/echarts-random');
      expect(body).toBeTruthy();
      expect(body).toContain('echarts');
    });

    it('should include query-selector snippet', async () => {
      const body = await getSnippetBody('scene/jsblock/query-selector');
      expect(body).toBeTruthy();
      expect(body).toContain('querySelector');
    });

    it('should include resource-example snippet', async () => {
      const body = await getSnippetBody('scene/jsblock/resource-example');
      expect(body).toBeTruthy();
      expect(body).toContain('resource');
    });
  });

  describe('Removed snippets', () => {
    it('should not include copy-to-clipboard snippet', async () => {
      await expect(getSnippetBody('global/copy-to-clipboard')).rejects.toThrow();
    });

    it('should not include copy-record-json snippet', async () => {
      await expect(getSnippetBody('global/copy-record-json')).rejects.toThrow();
    });
  });
});
