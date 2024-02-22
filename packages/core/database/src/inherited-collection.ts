import { default as lodash } from 'lodash';
import { Field } from '.';
import { Collection, CollectionContext, CollectionOptions } from './collection';

export class InheritedCollection extends Collection {
  parents?: Collection[];

  constructor(options: CollectionOptions, context: CollectionContext) {
    if (!options.inherits) {
      throw new Error('InheritedCollection must have inherits option');
    }

    options.inherits = lodash.castArray(options.inherits);

    super(options, context);

    try {
      this.bindParents();
    } catch (err) {
      if (err instanceof ParentCollectionNotFound) {
        const listener = (collection) => {
          if (
            options.inherits.includes(collection.name) &&
            (options.inherits as Array<string>).every((name) => this.db.collections.has(name))
          ) {
            this.bindParents();
            this.db.removeListener('afterDefineCollection', listener);
          }
        };

        this.db.addListener('afterDefineCollection', listener);
      } else {
        throw err;
      }
    }
  }

  getParents() {
    return this.parents;
  }

  getFlatParents() {
    // get parents as flat array
    const parents = [];
    for (const parent of this.parents) {
      if (parent.isInherited()) {
        parents.push(...(<InheritedCollection>parent).getFlatParents());
      }

      parents.push(parent);
    }

    return parents;
  }

  parentFields() {
    const fields = new Map<string, Field>();

    for (const parent of this.parents) {
      if (parent.isInherited()) {
        for (const [name, field] of (<InheritedCollection>parent).parentFields()) {
          fields.set(name, field.options);
        }
      }

      const parentFields = parent.fields;
      for (const [name, field] of parentFields) {
        fields.set(name, field.options);
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

  protected bindParents() {
    this.setParents(this.options.inherits);
    this.setParentFields();
    this.setFields(this.options.fields, false);
    this.db.inheritanceMap.setInheritance(this.name, this.options.inherits);
  }

  protected setParents(inherits: string | string[]) {
    this.parents = lodash.castArray(inherits).map((name) => {
      const existCollection = this.db.collections.get(name);
      if (!existCollection) {
        throw new ParentCollectionNotFound(name);
      }

      return existCollection;
    });
  }

  protected setParentFields() {
    for (const [name, fieldOptions] of this.parentFields()) {
      this.setField(name, {
        ...fieldOptions,
        inherit: true,
      });
    }
  }
}

class ParentCollectionNotFound extends Error {
  constructor(name: string) {
    super(`parent collection ${name} not found`);
  }
}
