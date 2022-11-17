import { omit } from 'lodash';
import { BelongsToManyOptions as SequelizeBelongsToManyOptions, Utils } from 'sequelize';
import { Collection } from '../collection';
import { checkIdentifier } from '../utils';
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

  get otherKey() {
    return this.options.otherKey;
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
        // timestamps: false,
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
    return true;
  }

  unbind() {
    const { database, collection } = this.context;
    const Through = database.getCollection(this.through);

    // 如果关系字段还没建立就删除了，也同步删除待建立关联的关系字段
    database.removePendingField(this);
    // 删掉 model 的关联字段

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
