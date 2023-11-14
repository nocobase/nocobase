import { css, defaultFieldNames } from '@nocobase/client';

import { NAMESPACE } from '../locale';
import { WorkflowVariableRawTextArea } from '../variable';

export default {
  title: `{{t("SQL action", { ns: "${NAMESPACE}" })}}`,
  type: 'sql',
  group: 'collection',
  description: `{{t("Execute a SQL statement in database.", { ns: "${NAMESPACE}" })}}`,
  fieldset: {
    sql: {
      type: 'string',
      required: true,
      title: 'SQL',
      description: `{{t("Usage of SQL query result is not supported yet.", { ns: "${NAMESPACE}" })}}`,
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
  },
  scope: {},
  components: {
    WorkflowVariableRawTextArea,
  },
  useVariables({ key, title }, { types, fieldNames = defaultFieldNames }) {
    return {
      [fieldNames.value]: key,
      [fieldNames.label]: title,
    };
  },
};
