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
    this.context.database.inheritanceMap.setInheritance(this.name, options.inherits);
    this.setParentFields();
  }

  protected setParents(inherits: string | string[]) {
    this.parents = lodash.castArray(inherits).map((name) => this.context.database.collections.get(name));
  }

  protected setParentFields() {
    for (const [name, field] of this.parentFields()) {
      if (!this.hasField(name)) {
        this.setField(name, {
          ...field.options,
          inherit: true,
        });
      }
    }
  }

  getParents() {
    return this.parents;
  }

  parentFields() {
    const fields = new Map<string, Field>();
    for (const parent of this.parents) {
      if (parent.isInherited()) {
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

  parentAttributes() {
    const attributes = {};
    for (const parent of this.parents) {
      if (parent.isInherited()) {
        Object.assign(attributes, (<InheritedCollection>parent).parentAttributes());
      }

      const parentAttributes = (<any>parent.model).tableAttributes;

      Object.assign(attributes, parentAttributes);
    }

    return attributes;
  }

  isInherited() {
    return true;
  }
}
