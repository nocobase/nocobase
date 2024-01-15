import { CollectionFieldInterfaceBase, IField, interfacesProperties } from '@nocobase/client';

import { NAMESPACE } from '../locale';

const { defaultProps } = interfacesProperties;

export const expression = {
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
} as IField;

export class ExpressionFieldInterface extends CollectionFieldInterfaceBase {
  name = 'expression';
  type = 'string';
  group = 'advanced';
  order = 1;
  title = `{{t("Expression", { ns: "${NAMESPACE}" })}}`;
  description = `{{t("An expression for calculation in each rows", { ns: "${NAMESPACE}" })}}`;
  sortable = true;
  default = {
    type: 'text',
    uiSchema: {
      'x-component': 'DynamicExpression',
    },
  };
  properties = {
    ...defaultProps,
  };
}
