import { Collection, CollectionContext, CollectionOptions } from './collection';

export class ViewCollection extends Collection {
  constructor(options: CollectionOptions, context: CollectionContext) {
    if (!options?.writeableView) {
      options.autoGenId = false;
      options.timestamps = false;
    }

    super(options, context);
  }

  isView() {
    return true;
  }

  protected sequelizeModelOptions(): any {
    const modelOptions = super.sequelizeModelOptions();
    modelOptions.tableName = this.options.viewName || this.options.name;
    return modelOptions;
  }
}
