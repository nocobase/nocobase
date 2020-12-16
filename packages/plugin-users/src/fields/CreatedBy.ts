import { BelongsToOptions, BELONGSTO, FieldContext } from '@nocobase/database';
import { setUserValue } from './utils';



export default class CreatedBy extends BELONGSTO {

  public readonly options: BelongsToOptions;

  static beforeBulkCreateHook(this: CreatedBy, models, { context }) {
    models.forEach(model => {
      setUserValue.call(this, model, { context });
    });
  }
  
  constructor(options: BelongsToOptions, context: FieldContext) {
    super(options, context);
    const Model = context.sourceTable.getModel();
    // TODO(feature): 可考虑策略模式，以在需要时对外提供接口
    Model.addHook('beforeCreate', setUserValue.bind(this));
    Model.addHook('beforeBulkCreate', CreatedBy.beforeBulkCreateHook.bind(this));
  }
}
