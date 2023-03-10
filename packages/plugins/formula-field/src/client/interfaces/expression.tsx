import { IField, interfacesProperties } from "@nocobase/client";

import { NAMESPACE } from "../locale";

const { defaultProps } = interfacesProperties;

export default {
  name: 'expression',
  type: 'object',
  group: 'advanced',
  order: 1,
  title: `{{t("Dynamic expression", { ns: "${NAMESPACE}" })}}`,
  description: `{{t("An expression for calculation in rows", { ns: "${NAMESPACE}" })}}`,
  sortable: true,
  default: {
    type: 'expression',
    uiSchema: {
      type: 'void',
      // title,
      'x-component': 'DynamicExpressionConfig',
    },
  },
  properties: {
    ...defaultProps,
  },
} as IField;
