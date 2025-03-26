/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escape, escapeSpecialChars, revertEscape } from '../escape';
import { createJSONTemplateParser } from '../parser';
import { Helper } from '../types';
const parser = createJSONTemplateParser();
const engine = parser.engine;

export function extractTemplateVariable(template: string): string | null {
  const escapedTemplate = escape(template ?? '');
  try {
    const fullVariable = engine.fullVariablesSync(escapedTemplate)[0] ?? '';
    return revertEscape(fullVariable);
  } catch (e) {
    return null;
  }
}

export function extractTemplateElements(template: string): {
  fullVariable: string | null;
  variableSegments: string[];
  helpers: Helper[];
} {
  const escapedTemplate = escape(template ?? '');
  try {
    const variableSegments = engine.variableSegmentsSync(escapedTemplate)[0] ?? [];
    const fullVariable = variableSegments.join('.');
    const parsedTemplate = engine.parse(escapedTemplate)[0] ?? {};
    const helpers =
      //@ts-ignore
      parsedTemplate?.value?.filters?.map(({ name, handler, args }) => ({
        name,
        handler,
        args: args.map((arg) => arg.content),
      })) ?? [];

    return revertEscape({ fullVariable, variableSegments, helpers });
  } catch (e) {
    return { fullVariable: null, variableSegments: [], helpers: [] };
  }
}

const composeFilterTemplate = (filter: Helper) => {
  const value = `${filter.name}${
    filter.args.length ? `:${filter.args.map((val) => JSON.stringify(val)).join(',')}` : ''
  }`;
  return value;
};

export const composeTemplate = ({ fullVariable, helpers }: { fullVariable: string; helpers: any[] }) => {
  const filtersTemplate = helpers.map(composeFilterTemplate).join(' | ');
  const innerTemplateStr = [fullVariable, filtersTemplate].filter(Boolean).join(' | ');
  return `{{${innerTemplateStr}}}`;
};
