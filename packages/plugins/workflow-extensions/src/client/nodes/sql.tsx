import React from 'react';
import { css } from '@emotion/css';

import { Variable } from '@nocobase/client';

import { NAMESPACE } from '../locale';
import { useWorkflowVariableOptions } from '@nocobase/plugin-workflow/client';

export default {
  title: `{{t("SQL action", { ns: "${NAMESPACE}" })}}`,
  type: 'sql',
  group: 'extended',
  description: `{{t("Execute a SQL statement in database.", { ns: "${NAMESPACE}" })}}`,
  fieldset: {
    sql: {
      type: 'string',
      required: true,
      title: 'SQL',
      description: `{{t("Result of SQL query is not supported yet.", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'SQLInput',
      'x-component-props': {
        rows: 20,
        className: css`
          font-size: 80%;
          font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
        `,
      },
    },
  },
  scope: {},
  components: {
    SQLInput(props) {
      const scope = useWorkflowVariableOptions();
      return <Variable.RawTextArea scope={scope} {...props} />;
    },
  },
};
