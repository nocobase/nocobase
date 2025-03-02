/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeSpecialChars, escape, revertEscape } from '../escape';
import engine from '../engine';

type Filter = {
  name: string;
  handler: any;
  args: string[];
};

export function extractTemplateElements(template: string) {
  const escapedTemplate = escape(template ?? '');
  const fullVariable = engine.fullVariablesSync(escapeSpecialChars(escapedTemplate))[0] ?? '';
  const variableSegments = engine.variableSegmentsSync(escapedTemplate)[0] ?? [];
  const parsedTemplate = engine.parse(escapedTemplate)[0] ?? {};

  const filters =
    //@ts-ignore
    parsedTemplate?.value?.filters?.map(({ name, handler, args }) => ({
      name,
      handler,
      args: args.map((arg) => arg.content),
    })) ?? [];

  return revertEscape({ fullVariable, variableSegments, filters });
}

const composeFilterTemplate = (filter: Filter) => {
  const value = `${filter.name}${
    filter.args.length ? `:${filter.args.map((val) => JSON.stringify(val)).join(',')}` : ''
  }`;
  return value;
};

export const composeTemplate = ({ fullVariable, filters }: { fullVariable: string; filters: any[] }) => {
  const filtersTemplate = filters.map(composeFilterTemplate).join(' | ');
  const innerTemplateStr = [fullVariable, filtersTemplate].filter(Boolean).join(' | ');
  return `{{${innerTemplateStr}}}`;
};
