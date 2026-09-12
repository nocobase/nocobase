/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { LANGUAGES_LIST, LANGUAGES_MAP } from '../languages';

vi.mock('@codemirror/lang-javascript', () => ({
  javascript: () => 'javascript-parser',
}));

vi.mock('@codemirror/lang-java', () => ({
  java: () => 'java-parser',
}));

vi.mock('@codemirror/lang-sql', () => ({
  sql: () => 'sql-parser',
}));

vi.mock('@codemirror/lang-python', () => ({
  python: () => 'python-parser',
}));

vi.mock('@codemirror/language', () => ({
  StreamLanguage: {
    define: (mode: unknown) => ({
      mode,
      type: 'stream-language',
    }),
  },
}));

vi.mock('@codemirror/legacy-modes/mode/groovy', () => ({
  groovy: {
    name: 'groovy',
  },
}));

describe('languages', () => {
  it('exposes language options by value', async () => {
    expect(Object.keys(LANGUAGES_MAP)).toEqual(['javascript', 'java', 'sql', 'python', 'groovy']);
    expect(LANGUAGES_LIST.map((item) => item.label)).toEqual(['JavaScript', 'Java', 'SQL', 'Python', 'Groovy']);

    await expect(LANGUAGES_MAP.javascript.load()).resolves.toBe('javascript-parser');
    await expect(LANGUAGES_MAP.java.load()).resolves.toBe('java-parser');
    await expect(LANGUAGES_MAP.sql.load()).resolves.toBe('sql-parser');
    await expect(LANGUAGES_MAP.python.load()).resolves.toBe('python-parser');
    await expect(LANGUAGES_MAP.groovy.load()).resolves.toEqual({
      mode: {
        name: 'groovy',
      },
      type: 'stream-language',
    });
  });
});
