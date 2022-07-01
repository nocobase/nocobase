import { omit } from 'lodash';
import { BelongsToManyOptions as SequelizeBelongsToManyOptions, Utils } from 'sequelize';
import { Collection } from '../collection';
import { MultipleRelationFieldOptions, RelationField } from './relation-field';

export class BelongsToManyField extends RelationField {
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
      Through = database.collection({
        name: through,
      });
      Object.defineProperty(Through.model, 'isThrough', { value: true });
    }

    const association = collection.model.belongsToMany(Target, {
      constraints: false,
      ...omit(this.options, ['name', 'type', 'target']),
      as: this.name,
      through: Through.model,
    });

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
    if (!this.options.through) {
      this.options.through = this.through;
    }
    Through.addIndex([this.options.foreignKey]);
    Through.addIndex([this.options.otherKey]);
    return true;
  }

  unbind() {
    const { database, collection } = this.context;
    // 如果关系字段还没建立就删除了，也同步删除待建立关联的关系字段
    database.removePendingField(this);
    // 删掉 model 的关联字段
    delete collection.model.associations[this.name];
  }
}

export interface BelongsToManyFieldOptions
  extends MultipleRelationFieldOptions,
    Omit<SequelizeBelongsToManyOptions, 'through'> {
  type: 'belongsToMany';
  through?: string;
}
