import lodash, { omit } from 'lodash';
import { BelongsToOptions as SequelizeBelongsToOptions, Utils } from 'sequelize';
import { buildReference, Reference, ReferencePriority } from '../features/references-map';
import { checkIdentifier } from '../utils';
import { BaseRelationFieldOptions, RelationField } from './relation-field';

export class BelongsToField extends RelationField {
  static type = 'belongsTo';

  get dataType() {
    return 'BelongsTo';
  }

  get target() {
    const { target, name } = this.options;
    return target || Utils.pluralize(name);
  }

  static toReference(db, association, onDelete, priority: ReferencePriority = 'default'): Reference {
    const targetKey = association.targetKey;

    return buildReference({
      sourceCollectionName: db.modelCollection.get(association.source).name,
      sourceField: association.foreignKey,
      targetField: targetKey,
      targetCollectionName: db.modelCollection.get(association.target).name,
      onDelete: onDelete,
      priority: priority,
    });
  }

  reference(association): Reference {
    return BelongsToField.toReference(
      this.database,
      association,
      this.options.onDelete,
      this.options.onDelete ? 'user' : 'default',
    );
  }

  checkAssociationKeys() {
    let { foreignKey, targetKey } = this.options;

    if (!targetKey) {
      targetKey = this.TargetModel.primaryKeyAttribute;
    }

    if (!foreignKey) {
      foreignKey = lodash.camelCase(`${this.name}_${targetKey}`);
    }

    const targetKeyAttribute = this.TargetModel.rawAttributes[targetKey];
    const foreignKeyAttribute = this.collection.model.rawAttributes[foreignKey];

    if (!foreignKeyAttribute || !targetKeyAttribute) {
      // skip check if foreign key not exists
      return;
    }

    const foreignKeyType = foreignKeyAttribute.type.constructor.toString();
    const targetKeyType = targetKeyAttribute.type.constructor.toString();

    if (!this.keyPairsTypeMatched(foreignKeyType, targetKeyType)) {
      throw new Error(
        `Foreign key "${foreignKey}" type "${foreignKeyType}" does not match target key "${targetKey}" type "${targetKeyType}" in belongs to relation "${this.name}" of collection "${this.collection.name}"`,
      );
    }
  }

  bind() {
    const { database, collection } = this.context;
    const Target = this.TargetModel;

    // if target model not exists, add it to pending field,
    // it will bind later
    if (!Target) {
      database.addPendingField(this);
      return false;
    }

    this.checkAssociationKeys();

    if (collection.model.associations[this.name]) {
      delete collection.model.associations[this.name];
    }

    // define relation on sequelize model
    const association = collection.model.belongsTo(Target, {
      as: this.name,
      constraints: false,
      ...omit(this.options, ['name', 'type', 'target', 'onDelete']),
    });

    // inverse relation
    // this.TargetModel.hasMany(collection.model);

    // 建立关系之后从 pending 列表中删除
    database.removePendingField(this);

    if (!this.options.foreignKey) {
      this.options.foreignKey = association.foreignKey;
    }

    if (!this.options.targetKey) {
      // @ts-ignore
      this.options.targetKey = association.targetKey;
    }

    try {
      checkIdentifier(this.options.foreignKey);
    } catch (error) {
      this.unbind();
      throw error;
    }

    if (!this.options.sourceKey) {
      // @ts-ignore
      this.options.sourceKey = association.sourceKey;
    }

    this.collection.addIndex([this.options.foreignKey]);

    const reference = this.reference(association);

    this.database.referenceMap.addReference(reference);

    return true;
  }

  unbind() {
    const { database, collection } = this.context;
    // 如果关系字段还没建立就删除了，也同步删除待建立关联的关系字段
    database.removePendingField(this);
    // 如果外键没有显式的创建，关系表也无反向关联字段，删除关系时，外键也删除掉
    const tcoll = database.collections.get(this.target);
    const foreignKey = this.options.foreignKey;
    const field1 = collection.getField(foreignKey);

    const field2 = tcoll
      ? tcoll.findField((field) => {
          return field.type === 'hasMany' && field.foreignKey === foreignKey;
        })
      : null;

    if (!field1 && !field2) {
      collection.model.removeAttribute(foreignKey);
    }

    const association = collection.model.associations[this.name];
    if (association && !this.options.inherit) {
      const reference = this.reference(association);
      this.database.referenceMap.removeReference(reference);
    }

    this.clearAccessors();
    // 删掉 model 的关联字段
    delete collection.model.associations[this.name];
    // @ts-ignore
    collection.model.refreshAttributes();
    // this.collection.removeIndex([this.options.foreignKey]);
  }
}

export interface BelongsToFieldOptions extends BaseRelationFieldOptions, SequelizeBelongsToOptions {
  type: 'belongsTo';
  target?: string;
}
