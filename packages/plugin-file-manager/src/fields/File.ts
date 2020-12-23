import { BELONGSTO, BelongsToOptions, FieldContext } from '@nocobase/database';

export interface URLOptions extends Omit<BelongsToOptions, 'type'> {
  type: 'file';
}

export default class File extends BELONGSTO {
  constructor({ type, ...options }, context: FieldContext) {
    // const { multiple = false } = options;
    super({
      ...options,
      type: 'belongsTo',
    } as BelongsToOptions, context);
  }

  public getDataType(): Function {
    return BELONGSTO;
  }
}
