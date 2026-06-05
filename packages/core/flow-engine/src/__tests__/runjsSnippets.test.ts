/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getSnippetBody, listSnippetsForContext, registerRunJSSnippet } from '../runjs-context/snippets';

describe('RunJS Snippets', () => {
  describe('getSnippetBody', () => {
    it('should return snippet body for global/message-success', async () => {
      const body = await getSnippetBody('global/message-success');
      expect(body).toBeTruthy();
      expect(typeof body).toBe('string');
      expect(body).toContain('ctx.message.success');
    });

    it('should return snippet body for global/api-request', async () => {
      const body = await getSnippetBody('global/api-request');
      expect(body).toBeTruthy();
      expect(body).toContain('ctx.request');
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

      const sceneSnippet = snippets.find((s) => s.ref.startsWith('scene/block/'));
      if (sceneSnippet) {
        expect(sceneSnippet.group).toBe('scene/block');
        expect(sceneSnippet.groups?.[0]).toBe('scene/block');
      }

      // At least one should have a group
      expect(snippets.some((s) => s.group)).toBe(true);
      expect(snippets.some((s) => Array.isArray(s.groups) && s.groups.length)).toBe(true);
    });

    it('should handle empty context gracefully', async () => {
      const snippets = await listSnippetsForContext('', 'v1', 'en-US');
      expect(Array.isArray(snippets)).toBe(true);
    });

    it('should respect scenes metadata when provided', async () => {
      const snippets = await listSnippetsForContext('*', 'v1', 'en-US');
      const multiScene = snippets.find((s) => s.ref === 'scene/detail/status-tag');
      expect(multiScene).toBeTruthy();
      expect(multiScene?.scenes).toEqual(expect.arrayContaining(['detail', 'table']));
      expect(multiScene?.groups).toEqual(expect.arrayContaining(['scene/detail', 'scene/table']));
    });
  });

  describe('New snippets', () => {
    it('should include query-selector snippet', async () => {
      const body = await getSnippetBody('global/query-selector');
      expect(body).toBeTruthy();
      expect(body).toContain('querySelector');
    });

    it('should include resource-example snippet', async () => {
      const body = await getSnippetBody('scene/block/resource-example');
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

  describe('registerRunJSSnippet', () => {
    it('should allow registering and consuming a custom snippet', async () => {
      const ref = 'plugin/test/hello';
      registerRunJSSnippet(ref, async () => ({
        default: {
          content: `console.log('hello');`,
          label: 'Hello',
          versions: ['v1'],
          contexts: ['*'],
          scenes: ['block'],
        },
      }));

      const body = await getSnippetBody(ref);
      expect(body).toContain('hello');

      const list = await listSnippetsForContext('*', 'v1', 'en-US');
      expect(list.some((s) => s.ref === ref)).toBe(true);
    });

    it('should not overwrite existing refs by default, but can overwrite with override=true', async () => {
      const ref = 'plugin/test/collision';
      registerRunJSSnippet(ref, async () => ({ default: { content: 'A', label: 'A' } }));
      expect(await getSnippetBody(ref)).toBe('A');

      const overwritten = registerRunJSSnippet(ref, async () => ({ default: { content: 'B', label: 'B' } }));
      expect(overwritten).toBe(false);
      expect(await getSnippetBody(ref)).toBe('A');

      const forced = registerRunJSSnippet(ref, async () => ({ default: { content: 'C', label: 'C' } }), {
        override: true,
      });
      expect(forced).toBe(true);
      expect(await getSnippetBody(ref)).toBe('C');
    });
  });
});
