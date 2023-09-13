import { BaseFieldOptions, DataTypes, Field } from '@nocobase/database';

export interface ExpressionFieldOptions extends BaseFieldOptions {
  type: 'expression';
}

export class ExpressionField extends Field {
  get dataType() {
    return DataTypes.TEXT;
  }
}
