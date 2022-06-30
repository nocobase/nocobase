import { omit } from 'lodash';
import { BelongsToOptions as SequelizeBelongsToOptions, Utils } from 'sequelize';
import { BaseRelationFieldOptions, RelationField } from './relation-field';

export class BelongsToField extends RelationField {
  static type = 'belongsTo';

  get target() {
    const { target, name } = this.options;
    return target || Utils.pluralize(name);
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

    if (collection.model.associations[this.name]) {
      delete collection.model.associations[this.name];
    }

    // define relation on sequelize model
    const association = collection.model.belongsTo(Target, {
      as: this.name,
      constraints: false,
      ...omit(this.options, ['name', 'type', 'target']),
    });

    // inverse relation
    // this.TargetModel.hasMany(collection.model);

    // 建立关系之后从 pending 列表中删除
    database.removePendingField(this);

    if (!this.options.foreignKey) {
      this.options.foreignKey = association.foreignKey;
    }

    if (!this.options.sourceKey) {
      // @ts-ignore
      this.options.sourceKey = association.sourceKey;
    }
    this.collection.addIndex([this.options.foreignKey]);
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
    const field2 = tcoll.findField((field) => {
      return field.type === 'hasMany' && field.foreignKey === foreignKey;
    });
    if (!field1 && !field2) {
      collection.model.removeAttribute(foreignKey);
    }
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
