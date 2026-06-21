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

import { NodeExpandOutlined } from '@ant-design/icons';
import { ArrayTable } from '@formily/antd-v5';
import { css, defaultFieldNames, i18n } from '@nocobase/client';
import { Registry } from '@nocobase/utils/client';
import React from 'react';

import { Instruction, WorkflowVariableInput, WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client';
import { NAMESPACE } from '../locale';

interface JSONQueryEngine {
  label: string;
  link: string;
}

const engines = new Registry<JSONQueryEngine>();

engines.register('jmespath', {
  label: 'JMESPath',
  link: 'https://jmespath.org/',
});

engines.register('jsonpathplus', {
  label: 'JSON Path Plus',
  link: 'https://jsonpath-plus.github.io/JSONPath/docs/ts/',
});

engines.register('jsonata', {
  label: 'JSONata',
  link: 'https://jsonata.org/',
});

function getEngineOptions() {
  return Array.from(engines.getEntities()).reduce(
    (result: any[], [value, options]) => result.concat({ value, ...options }),
    [],
  );
}

function renderEngineReference(key: string) {
  const engine = engines.get(key);
  if (!engine) {
    return null;
  }

  return engine.link ? (
    <>
      <span
        className={css`
          &:after {
            content: ':';
          }
          & + a {
            margin-left: 0.25em;
          }
        `}
      >
        {i18n.t('Syntax references')}
      </span>
      <a href={engine.link} target="_blank" rel="noreferrer">
        {engine.label}
      </a>
    </>
  ) : null;
}

export default class extends Instruction {
  title = `{{t("JSON calculation", { ns: "${NAMESPACE}" })}}`;
  type = 'json-query';
  group = 'calculation';
  description = `{{t("Transforming or calculating values from complex JSON data.", { ns: "${NAMESPACE}" })}}`;
  icon = (<NodeExpandOutlined />);
  fieldset = {
    engine: {
      type: 'string',
      title: `{{t("Query engine", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: '{{getEngineOptions()}}',
      required: true,
      default: 'jmespath',
    },
    source: {
      type: 'string',
      title: `{{t("Data source", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableInput',
      'x-component-props': {
        changeOnSelect: true,
      },
      required: true,
    },
    expression: {
      type: 'string',
      title: `{{t("Query expression", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableTextArea',
      required: true,
      'x-reactions': {
        dependencies: ['engine'],
        fulfill: {
          state: {
            visible: '{{$deps[0]}}',
          },
          schema: {
            description: '{{renderEngineReference($deps[0])}}',
          },
        },
      },
    },
    model: {
      type: 'array',
      title: `{{t("Properties mapping", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("If the type of query result is object or array of object, could map the properties which to be accessed in subsequent nodes.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'ArrayTable',
      items: {
        type: 'object',
        properties: {
          path: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { title: `{{t("Property key", { ns: "${NAMESPACE}" })}}` },
            properties: {
              path: {
                type: 'string',
                name: 'path',
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
            },
          },
          alias: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { title: `{{t("Alias", { ns: "${NAMESPACE}" })}}` },
            properties: {
              alias: {
                type: 'string',
                name: 'alias',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
            },
          },
          label: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { title: `{{t("Display label", { ns: "${NAMESPACE}" })}}` },
            properties: {
              label: {
                type: 'string',
                name: 'label',
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
            },
          },
          operations: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': {
              dataIndex: 'operations',
              fixed: 'right',
              className: css`
                > *:not(:last-child) {
                  margin-right: 0.5em;
                }
                button {
                  padding: 0;
                }
              `,
            },
            properties: {
              remove: {
                type: 'void',
                'x-component': 'ArrayTable.Remove',
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          'x-component': 'ArrayTable.Addition',
          'x-component-props': {
            defaultValue: {},
          },
          title: `{{t("Add property", { ns: "${NAMESPACE}" })}}`,
        },
      },
    },
  };
  scope = {
    renderEngineReference,
    getEngineOptions,
  };
  components = {
    ArrayTable,
    WorkflowVariableInput,
    WorkflowVariableTextArea,
  };
  useVariables({ key, title, config }, { types, fieldNames = defaultFieldNames }) {
    return {
      [fieldNames.value]: key,
      [fieldNames.label]: title,
      children: config.model?.length
        ? config.model.map((item: any) => ({
            [fieldNames.value]: item.alias || item.path,
            [fieldNames.label]: item.label,
          }))
        : null,
    };
  }
  testable = true;
}
