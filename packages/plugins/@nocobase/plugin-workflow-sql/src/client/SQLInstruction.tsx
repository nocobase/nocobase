import { css } from '@nocobase/client';

import { Instruction, WorkflowVariableRawTextArea, defaultFieldNames } from '@nocobase/plugin-workflow/client';

import { NAMESPACE } from '../locale';
import { Trans } from 'react-i18next';
import React from 'react';

export default class extends Instruction {
  title = `{{t("SQL action", { ns: "${NAMESPACE}" })}}`;
  type = 'sql';
  group = 'collection';
  description = `{{t("Execute a SQL statement in database.", { ns: "${NAMESPACE}" })}}`;
  fieldset = {
    sql: {
      type: 'string',
      required: true,
      title: 'SQL',
      description: '{{sqlDescription()}}',
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableRawTextArea',
      'x-component-props': {
        rows: 20,
        className: css`
          font-size: 80%;
          font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
        `,
      },
    },
  };
  scope = {
    sqlDescription() {
      return (
        <Trans ns={NAMESPACE}>
          {'SQL query result could be used through '}
          <a href="https://docs-cn.nocobase.com/plugins/workflow-json-query" target="_blank" rel="noreferrer">
            {'JSON query node'}
          </a>
          {' (Commercial plugin).'}
        </Trans>
      );
    },
  };
  components = {
    WorkflowVariableRawTextArea,
  };
  useVariables({ key, title }, { types, fieldNames = defaultFieldNames }) {
    return {
      [fieldNames.value]: key,
      [fieldNames.label]: title,
    };
  }
}
