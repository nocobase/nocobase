import { Collection, CollectionContext, CollectionOptions } from './collection';
import { default as lodash } from 'lodash';
import { Field } from '.';

export class InheritedCollection extends Collection {
  parents?: Collection[];

  constructor(options: CollectionOptions, context: CollectionContext) {
    if (!options.inherits) {
      throw new Error('InheritedCollection must have inherits option');
    }

    super(options, context);
    this.setParents(options.inherits);
  }

  protected setParents(inherits: string | string[]) {
    this.parents = lodash.castArray(inherits).map((name) => this.context.database.collections.get(name));
  }

  getField<F extends Field>(name: string): F {
    const field = super.getField<F>(name);
    if (field) {
      return field;
    }

    for (const parent of this.parents) {
      const field = parent.getField<F>(name);
      if (field) {
        return field;
      }
    }
  }
}
