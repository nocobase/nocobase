import { omit } from 'lodash';
import { AssociationScope, BelongsToManyOptions as SequelizeBelongsToManyOptions, Utils } from 'sequelize';
import { Collection } from '../collection';
import { Reference } from '../features/references-map';
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

    const priority = this.options.onDelete ? 'user' : 'default';

    const targetAssociation = association.toTarget;

    if (association.targetKey) {
      targetAssociation.targetKey = association.targetKey;
    }

    const sourceAssociation = association.toSource;

    if (association.sourceKey) {
      sourceAssociation.targetKey = association.sourceKey;
    }

    return [
      BelongsToField.toReference(db, targetAssociation, onDelete, priority),
      BelongsToField.toReference(db, sourceAssociation, onDelete, priority),
    ];
  }

  checkAssociationKeys(database) {
    let { foreignKey, sourceKey, otherKey, targetKey } = this.options;

    const through = this.through;
    const throughCollection = database.getCollection(through);

    if (!throughCollection) {
      // skip check if through collection not found
      return;
    }

    if (!sourceKey) {
      sourceKey = this.collection.model.primaryKeyAttribute;
    }

    if (!foreignKey) {
      foreignKey = Utils.camelize([Utils.singularize(this.collection.model.name), sourceKey].join('_'));
    }

    if (!targetKey) {
      targetKey = this.TargetModel.primaryKeyAttribute;
    }

    if (!otherKey) {
      otherKey = Utils.camelize([Utils.singularize(this.TargetModel.name), targetKey].join('_'));
    }

    const foreignKeyAttribute = throughCollection.model.rawAttributes[foreignKey];
    const otherKeyAttribute = throughCollection.model.rawAttributes[otherKey];
    const sourceKeyAttribute = this.collection.model.rawAttributes[sourceKey];
    const targetKeyAttribute = this.TargetModel.rawAttributes[targetKey];

    if (!foreignKeyAttribute || !otherKeyAttribute || !sourceKeyAttribute || !targetKeyAttribute) {
      return;
    }

    const foreignKeyType = foreignKeyAttribute.type.constructor.toString();
    const otherKeyType = otherKeyAttribute.type.constructor.toString();
    const sourceKeyType = sourceKeyAttribute.type.constructor.toString();
    const targetKeyType = targetKeyAttribute.type.constructor.toString();

    if (!this.keyPairsTypeMatched(foreignKeyType, sourceKeyType)) {
      throw new Error(
        `Foreign key "${foreignKey}" type "${foreignKeyType}" does not match source key "${sourceKey}" type "${sourceKeyType}" in belongs to many relation "${this.name}" of collection "${this.collection.name}"`,
      );
    }

    if (!this.keyPairsTypeMatched(otherKeyType, targetKeyType)) {
      throw new Error(
        `Other key "${otherKey}" type "${otherKeyType}" does not match target key "${targetKey}" type "${targetKeyType}" in belongs to many relation "${this.name}" of collection "${this.collection.name}"`,
      );
    }
  }

  bind() {
    const { database, collection } = this.context;

    const Target = this.TargetModel;

    if (!Target) {
      database.addPendingField(this);
      return false;
    }

    if (!this.collection.model.primaryKeyAttribute) {
      throw new Error(`Collection model ${this.collection.model.name} has no primary key attribute`);
    }

    if (!Target.primaryKeyAttribute) {
      throw new Error(`Target model ${Target.name} has no primary key attribute`);
    }

    this.checkAssociationKeys(database);

    const through = this.through;

    let Through: Collection;

    if (database.hasCollection(through)) {
      Through = database.getCollection(through);
    } else {
      const throughCollectionOptions = {
        name: through,
      };

      if (this.collection.options.dumpRules) {
        throughCollectionOptions['dumpRules'] = this.collection.options.dumpRules;
      }

      // set through collection schema
      if (this.collection.collectionSchema()) {
        throughCollectionOptions['schema'] = this.collection.collectionSchema();
      }

      Through = database.collection(throughCollectionOptions);

      Object.defineProperty(Through.model, 'isThrough', { value: true });
    }

    const belongsToManyOptions = {
      constraints: false,
      ...omit(this.options, ['name', 'type', 'target']),
      as: this.name,
      through: {
        model: Through.model,
        scope: this.options.throughScope,
        paranoid: this.options.throughParanoid,
        unique: this.options.throughUnique,
      },
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

    if (!this.options.targetKey) {
      this.options.targetKey = association.targetKey;
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
  throughScope?: AssociationScope;
  throughUnique?: boolean;
  throughParanoid?: boolean;
}
