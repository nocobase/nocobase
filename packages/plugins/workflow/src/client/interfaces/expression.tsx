import { IField, interfacesProperties } from '@nocobase/client';

import { NAMESPACE } from '../locale';

const { defaultProps } = interfacesProperties;

export default {
  name: 'expression',
  type: 'string',
  group: 'advanced',
  order: 1,
  title: `{{t("Expression", { ns: "${NAMESPACE}" })}}`,
  description: `{{t("An expression for calculation in each rows", { ns: "${NAMESPACE}" })}}`,
  sortable: true,
  default: {
    type: 'text',
    uiSchema: {
      'x-component': 'DynamicExpression',
    },
  },
  properties: {
    ...defaultProps,
  },
  invariable: true,
} as IField;
