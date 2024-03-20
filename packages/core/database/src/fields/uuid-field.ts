import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field, FieldContext } from './field';

export class UuidField extends Field {
  constructor(options?: any, context?: FieldContext) {
    super(
      {
        defaultValue: new DataTypes.UUIDV4(),
        ...options,
      },
      context,
    );
  }
  get dataType() {
    return DataTypes.UUID;
  }
}

export interface UUIDFieldOptions extends BaseColumnFieldOptions {
  type: 'uuid';
}
