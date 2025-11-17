/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';
import { ARRAY_KEY_IN_PATH } from '../contants';

type Variable = {
  key: string;
  path: string;
  title: string;
  children: Array<Variable>;
};
export type JSONVariableMappingInstructionConfig = {
  variables: Array<Variable>;
  dataSource: string;
};

function getArrValue(dataSource, paths, parseArray) {
  if (!Array.isArray(dataSource)) {
    return [];
  }

  const newPath = [...paths];
  // if (newPath[0] === ARRAY_KEY_IN_PATH) {
  //   newPath.shift();
  //   return getArrValue(dataSource, newPath);
  // }

  const key = newPath.shift();
  let result = [];

  dataSource.forEach((data) => {
    if (newPath.length === 0) {
      data[key] && result.push(data[key]);
    } else if (key === ARRAY_KEY_IN_PATH && Array.isArray(data)) {
      result = getArrValue(data, newPath, parseArray);
    } else {
      const value = getVaule(data[key], newPath, parseArray);
      value && result.push(value);
    }
  });

  return result;
}
function getVaule(dataSource, paths, parseArray) {
  const newPath = [...paths];

  if (!dataSource) {
    return dataSource;
  }
  if (newPath[0] === ARRAY_KEY_IN_PATH) {
    newPath.shift();
    if (!parseArray) {
      return getArrValue(dataSource, newPath, parseArray);
    }
  }

  const key = newPath.shift();
  const value = dataSource[key];
  if (newPath.length === 0) {
    return value;
  }
  if (!value) {
    return value;
  }
  return getVaule(value, newPath, parseArray);
}
function parseInput(dataSource = {}, variables = [], parseArray?: boolean) {
  if (!Array.isArray(variables)) {
    return {};
  }

  let result = {};
  variables.forEach((item) => {
    if (item.children?.length) {
      const childrenResult = parseInput(dataSource, item.children, parseArray);
      result = {
        ...result,
        ...childrenResult,
        [item.key]: getVaule(dataSource, item.path, parseArray),
      };
    } else {
      result[item.key] = getVaule(dataSource, item.paths, parseArray);
    }
  });
  return result;
}

export default class JSONVariableMappingInstruction extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { dataSource, variables, parseArray } = node.config;
    const input = processor.getParsedValue(dataSource, node.id);
    if (typeof input !== 'object' || input == null) {
      return {
        result: 'The input data is not an object nor an array',
        status: JOB_STATUS.FAILED,
      };
    }
    const result = parseInput(input, variables, parseArray);
    return {
      result,
      status: JOB_STATUS.RESOLVED,
    };
  }
}
