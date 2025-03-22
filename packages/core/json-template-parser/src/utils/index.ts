/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeSpecialChars, escape, revertEscape } from '../escape';
import { createJSONTemplateParser } from '../parser';

const parser = createJSONTemplateParser();
const engine = parser.engine;
type Filter = {
  name: string;
  handler: any;
  args: string[];
};

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
  helpers: Filter[];
} {
  const escapedTemplate = escape(template ?? '');
  try {
    const fullVariable = engine.fullVariablesSync(escapedTemplate)[0] ?? '';
    const variableSegments = engine.variableSegmentsSync(escapedTemplate)[0] ?? [];
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

const composeFilterTemplate = (filter: Filter) => {
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
