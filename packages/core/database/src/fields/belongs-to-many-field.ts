import { omit } from 'lodash';
import { BelongsToManyOptions as SequelizeBelongsToManyOptions, Utils } from 'sequelize';
import { Collection } from '../collection';
import { Reference } from '../features/ReferencesMap';
import { checkIdentifier } from '../utils';
import { BelongsToField } from './belongs-to-field';
import { MultipleRelationFieldOptions, RelationField } from './relation-field';

export class BelongsToManyField extends RelationField {
  get dataType() {
    return 'BelongsToMany';
  }

  get through() {
    return (
      this.options.through ||
      Utils.camelize(
        [this.context.collection.model.name, this.target]
          .map((name) => name.toLowerCase())
          .sort()
          .join('_'),
      )
    );
  }

  get otherKey() {
    return this.options.otherKey;
  }

  references(association): Reference[] {
    const db = this.context.database;

    const onDelete = this.options.onDelete || 'CASCADE';

    const targetAssociation = association.toTarget;

    if (association.targetKey) {
      targetAssociation.targetKey = association.targetKey;
    }

    const sourceAssociation = association.toSource;

    if (association.sourceKey) {
      sourceAssociation.targetKey = association.sourceKey;
    }

    return [
      BelongsToField.toReference(db, targetAssociation, onDelete),
      BelongsToField.toReference(db, sourceAssociation, onDelete),
    ];
  }

  bind() {
    const { database, collection } = this.context;

    const Target = this.TargetModel;

    if (!Target) {
      database.addPendingField(this);
      return false;
    }

    const through = this.through;

    let Through: Collection;

    if (database.hasCollection(through)) {
      Through = database.getCollection(through);
    } else {
      const throughCollectionOptions = {
        name: through,
      };

      // set through collection schema
      if (this.collection.collectionSchema()) {
        throughCollectionOptions['schema'] = this.collection.collectionSchema();
      }

      Through = database.collection(throughCollectionOptions);

      Object.defineProperty(Through.model, 'isThrough', { value: true });
    }

    if (!this.options.onDelete) {
      this.options.onDelete = 'CASCADE';
    }

    const belongsToManyOptions = {
      constraints: false,
      ...omit(this.options, ['name', 'type', 'target']),
      as: this.name,
      through: Through.model,
    };

    const association = collection.model.belongsToMany(Target, belongsToManyOptions);

    // 建立关系之后从 pending 列表中删除
    database.removePendingField(this);

    if (!this.options.foreignKey) {
      this.options.foreignKey = association.foreignKey;
    }

    if (!this.options.sourceKey) {
      this.options.sourceKey = association.sourceKey;
    }

    if (!this.options.otherKey) {
      this.options.otherKey = association.otherKey;
    }

    try {
      checkIdentifier(this.options.foreignKey);
      checkIdentifier(this.options.otherKey);
    } catch (error) {
      this.unbind();
      throw error;
    }

    if (!this.options.through) {
      this.options.through = this.through;
    }

    Through.addIndex([this.options.foreignKey]);
    Through.addIndex([this.options.otherKey]);

    this.references(association).forEach((reference) => this.database.referenceMap.addReference(reference));
    return true;
  }

  unbind() {
    const { database, collection } = this.context;
    const Through = database.getCollection(this.through);

    // 如果关系字段还没建立就删除了，也同步删除待建立关联的关系字段
    database.removePendingField(this);
    // 删掉 model 的关联字段

    const association = collection.model.associations[this.name];

    if (association && !this.options.inherit) {
      this.references(association).forEach((reference) => this.database.referenceMap.removeReference(reference));
    }

    this.clearAccessors();
    delete collection.model.associations[this.name];
  }
}

export interface BelongsToManyFieldOptions
  extends MultipleRelationFieldOptions,
    Omit<SequelizeBelongsToManyOptions, 'through'> {
  type: 'belongsToMany';
  target?: string;
  through?: string;
}
