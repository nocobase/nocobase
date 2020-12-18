import { BelongsToOptions, BELONGSTO, FieldContext } from '@nocobase/database';
import { setUserValue } from './utils';

export interface UpdatedByOptions extends Omit<BelongsToOptions, 'type'> {
  type: 'updatedBy' | 'updatedby'
}

export default class UpdatedBy extends BELONGSTO {

  static beforeBulkCreateHook(this: UpdatedBy, models, { context }) {
    models.forEach(model => {
      setUserValue.call(this, model, { context });
    });
  }

  static beforeBulkUpdateHook(this: UpdatedBy, models, { context }) {
    models.forEach(model => {
      setUserValue.call(this, model, { context });
    });
  }
  
  constructor({ type, ...options }: UpdatedByOptions, context: FieldContext) {
    super({ ...options, type: 'belongsTo' } as BelongsToOptions, context);
    const Model = context.sourceTable.getModel();
    // TODO(feature): 可考虑策略模式，以在需要时对外提供接口
    Model.addHook('beforeCreate', setUserValue.bind(this));
    Model.addHook('beforeBulkCreate', UpdatedBy.beforeBulkCreateHook.bind(this));

    Model.addHook('beforeUpdate', setUserValue.bind(this));
    Model.addHook('beforeBulkUpdate', UpdatedBy.beforeBulkUpdateHook.bind(this));
  }

  public getDataType(): Function {
    return BELONGSTO;
  }
}
