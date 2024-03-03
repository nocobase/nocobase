import { CollectionFieldInterface, interfacesProperties } from '@nocobase/client';

import { NAMESPACE } from '../locale';

const { defaultProps } = interfacesProperties;

export class ExpressionFieldInterface extends CollectionFieldInterface {
  name = 'expression';
  type = 'string';
  group = 'advanced';
  order = 1;
  title = `{{t("Expression", { ns: "${NAMESPACE}" })}}`;
  description = `{{t("Used to store expressions for use in workflows so that different expressions can be called for different data.", { ns: "${NAMESPACE}" })}}`;
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
