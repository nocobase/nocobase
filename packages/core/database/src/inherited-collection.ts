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

  getParents() {
    return this.parents;
  }

  parentFields() {
    const fields = new Map<string, Field>();
    for (const parent of this.parents) {
      if (parent.isInherired()) {
        for (const [name, field] of (<InheritedCollection>parent).parentFields()) {
          fields.set(name, field);
        }
      }

      const parentFields = parent.fields;
      for (const [name, field] of parentFields) {
        fields.set(name, field);
      }
    }
    return fields;
  }

  isInherired() {
    return true;
  }
}
