// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

const loaded = vi.hoisted(() => vi.fn());
vi.mock('@nocobase/ai-employee', () => {
  loaded();
  throw new Error('The command tree must not load the AI runtime.');
});

import cliPlugin from '../cli/index.js';

describe('CLI import boundary', () => {
  it('assembles commands without importing the heavy AI runtime or reading application configuration', () => {
    expect(Object.keys(cliPlugin.commands)).toEqual(['models', 'test']);
    expect(loaded).not.toHaveBeenCalled();
  });
});
