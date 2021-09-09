import { BelongsToOptions, BELONGSTO, FieldContext } from '@nocobase/database';
import { setUserValue } from './utils';

export interface CreatedByOptions extends Omit<BelongsToOptions, 'type'> {
  type: 'createdBy' | 'createdby'
}

export default class CreatedBy extends BELONGSTO {

  static beforeBulkCreateHook(this: CreatedBy, models, { context }) {
    models.forEach(model => {
      setUserValue.call(this, model, { context });
    });
  }

  constructor({ type, ...options }: CreatedByOptions, context: FieldContext) {
    super({ ...options, type: 'belongsTo' } as BelongsToOptions, context);
    // const Model = context.sourceTable.getModel();
    // TODO(feature): 可考虑策略模式，以在需要时对外提供接口
    // Model.addHook('beforeCreate', setUserValue.bind(this));
    // Model.addHook('beforeBulkCreate', CreatedBy.beforeBulkCreateHook.bind(this));
    const { sourceTable, database } = context;
    const name = sourceTable.getName();
    database.on(`${name}.beforeCreate`, setUserValue.bind(this));
    database.on(`${name}.beforeBulkCreate`, CreatedBy.beforeBulkCreateHook.bind(this));
  }

  public getDataType(): Function {
    return BELONGSTO;
  }
}
