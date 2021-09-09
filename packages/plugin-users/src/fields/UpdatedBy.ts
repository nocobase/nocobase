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

  static beforeBulkUpdateHook(this: UpdatedBy, { attributes, fields, context }) {
    if (!context) {
      return;
    }
    const { currentUser } = context.state;
    if (!currentUser) {
      return;
    }
    fields.push(this.options.foreignKey);
    attributes[this.options.foreignKey] = currentUser.get(this.options.targetKey);
  }

  constructor({ type, ...options }: UpdatedByOptions, context: FieldContext) {
    super({ ...options, type: 'belongsTo' } as BelongsToOptions, context);
    // const Model = context.sourceTable.getModel();
    // // TODO(feature): 可考虑策略模式，以在需要时对外提供接口
    // Model.addHook('beforeCreate', setUserValue.bind(this));
    // Model.addHook('beforeBulkCreate', UpdatedBy.beforeBulkCreateHook.bind(this));
    // Model.addHook('beforeUpdate', setUserValue.bind(this));
    // Model.addHook('beforeBulkUpdate', UpdatedBy.beforeBulkUpdateHook.bind(this));
    const { sourceTable, database } = context;
    const name = sourceTable.getName();
    database.on(`${name}.beforeCreate`, setUserValue.bind(this));
    database.on(`${name}.beforeBulkCreate`, UpdatedBy.beforeBulkCreateHook.bind(this));
    database.on(`${name}.beforeUpdate`, setUserValue.bind(this));
    database.on(`${name}.beforeBulkUpdate`, UpdatedBy.beforeBulkUpdateHook.bind(this));
  }

  public getDataType(): Function {
    return BELONGSTO;
  }
}
