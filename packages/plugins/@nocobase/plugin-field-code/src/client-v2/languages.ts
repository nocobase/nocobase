/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const LANGUAGES_LIST = [
  {
    value: 'javascript',
    label: 'JavaScript',
    async load() {
      const { javascript } = await import('@codemirror/lang-javascript');
      return javascript();
    },
  },
  {
    value: 'java',
    label: 'Java',
    async load() {
      const { java } = await import('@codemirror/lang-java');
      return java();
    },
  },
  {
    value: 'sql',
    label: 'SQL',
    async load() {
      const { sql } = await import('@codemirror/lang-sql');
      return sql();
    },
  },
  {
    value: 'python',
    label: 'Python',
    async load() {
      const { python } = await import('@codemirror/lang-python');
      return python();
    },
  },
  {
    value: 'groovy',
    label: 'Groovy',
    async load() {
      const { StreamLanguage } = await import('@codemirror/language');
      const { groovy } = await import('@codemirror/legacy-modes/mode/groovy');
      return StreamLanguage.define(groovy as any);
    },
  },
];

export const LANGUAGES_MAP = Object.fromEntries(
  LANGUAGES_LIST.map((item) => {
    return [item.value, item];
  }),
);
