/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { get } from 'lodash';
import { Registry } from '@nocobase/utils';

import { Instruction, Processor, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';

type JSONQueryEngine = (expression: string, scope: any) => any;

interface Config {
  source: string;
  engine?: string;
  expression?: string;
  model?: {
    path: string;
    alias?: string;
    label?: string;
  }[];
}

function mapModel(data, model) {
  const result = {};
  model.forEach(({ path, alias }) => {
    if (typeof data === 'object' && data) {
      result[alias || path.replace(/\./g, '_')] = get(data, path);
    }
  });
  return result;
}

export default class extends Instruction {
  engines = new Registry<JSONQueryEngine>();

  constructor(workflow) {
    super(workflow);

    this.engines.register('jmespath', (expression, scope) => {
      const jmespath = require('jmespath');
      return jmespath.search(scope, expression);
    });

    this.engines.register('jsonpathplus', (expression, scope) => {
      const { JSONPath } = require('jsonpath-plus');
      return JSONPath({ path: expression, json: scope, wrap: false });
    });

    this.engines.register('jsonata', (expression, scope) => {
      const jsonata = require('jsonata');
      return jsonata(expression).evaluate(scope);
    });
  }

  async execute({ engine = 'jmespath', expression, model, source }) {
    const query = <JSONQueryEngine | undefined>this.engines.get(engine);

    try {
      let result = query ? await query(expression, source) : source;
      if (model?.length && typeof result === 'object' && result) {
        result = Array.isArray(result) ? result.map((item) => mapModel(item, model)) : mapModel(result, model);
      }
      return {
        result,
        status: JOB_STATUS.RESOLVED,
      };
    } catch (e) {
      return {
        result: e.toString(),
        status: JOB_STATUS.ERROR,
      };
    }
  }

  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const { engine = 'jmespath', model, source = '' } = <Config>node.config;
    const { data, expression } = processor.getParsedValue(
      {
        data: source,
        expression: node.config?.expression || '',
      },
      node.id,
    );

    return this.execute({
      engine,
      expression,
      model,
      source: data,
    });
  }

  async test(config) {
    return this.execute(config);
  }
}
