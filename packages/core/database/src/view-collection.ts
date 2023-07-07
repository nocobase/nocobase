import { Collection, CollectionContext, CollectionOptions, RepositoryType } from './collection';
import { ViewRepository } from './repositories/view-repository';

export class ViewCollection extends Collection {
  constructor(options: CollectionOptions, context: CollectionContext) {
    options.autoGenId = false;
    options.timestamps = false;

    super(options, context);
  }

  isView() {
    return true;
  }

  setRepository(repository?: RepositoryType | string) {
    this.repository = new ViewRepository(this);
  }

  protected sequelizeModelOptions(): any {
    const modelOptions = super.sequelizeModelOptions();
    modelOptions.tableName = this.options.viewName || this.options.name;
    return modelOptions;
  }
}
