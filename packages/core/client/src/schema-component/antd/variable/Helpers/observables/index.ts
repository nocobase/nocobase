/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { extractTemplateElements, createJSONTemplateParser } from '@nocobase/json-template-parser';
type Helper = {
  name: string;
  argsMap: Record<string, any>;
  config: any;
  args: string[];
  handler: (value: any, ...args: any[]) => any;
};

type RawHelper = {
  name: string;
  argsMap: Record<string, any>;
};

const parser = createJSONTemplateParser();

export const rawHelpersObs = observable<{ value: RawHelper[] }>({ value: [] });

export const allHelpersConfigObs = observable<{ value: any[] }>({ value: parser.filters });

export const helpersObs = observable.computed(() => {
  return rawHelpersObs.value.map((helper) => {
    const config = allHelpersConfigObs.value.find((f) => f.name === helper.name);
    const args = config.uiSchema ? config.uiSchema.map((param) => helper.argsMap[param.name]) : [];
    return {
      ...helper,
      config,
      args,
      handler: config.handler,
    };
  });
}) as { value: Helper[] };

export const variableNameObs = observable<{ value: string }>({ value: '' });
export const variableSegmentsObs = observable<{ value: string[] }>({ value: [] });

export const addHelper = ({ name }: { name: string }) => {
  rawHelpersObs.value.push({ name, argsMap: {} });
};

export const removeHelper = ({ index }: { index: number }) => {
  rawHelpersObs.value.splice(index, 1);
};

export const setHelpersFromTemplateStr = ({ template }: { template: string }) => {
  const { fullVariable, helpers, variableSegments } = extractTemplateElements(
    typeof template === 'string' ? template : '',
  );
  variableNameObs.value = fullVariable;
  variableSegmentsObs.value = variableSegments;
  const computedHelpers = helpers.map((helper: any) => {
    const config = allHelpersConfigObs.value.find((f) => f.name === helper.name);
    const argsMap = config.uiSchema
      ? Object.fromEntries(config.uiSchema.map((param, index) => [param.name, helper.args[index]]))
      : {};
    return {
      name: helper.name,
      argsMap,
    };
  });
  rawHelpersObs.value = computedHelpers;
};
