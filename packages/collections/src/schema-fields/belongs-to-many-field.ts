import { omit } from 'lodash';
import { Sequelize, ModelCtor, Model, DataTypes, Utils } from 'sequelize';
import { RelationField } from './relation-field';

export class BelongsToManyField extends RelationField {
  get target() {
    const { target, name } = this.options;
    return target || name;
  }

  get through() {
    return (
      this.options.through ||
      [this.context.collection.model.name, this.target]
        .map((name) => name.toLowerCase())
        .sort()
        .join('_')
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
    let Through =
      database.getCollection(through) ||
      database.collection({
        name: through,
      });
    const association = collection.model.belongsToMany(Target, {
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
    return true;
  }

  unbind() {
    // const { database, collection } = this.context;
    // // 如果关系字段还没建立就删除了，也同步删除待建立关联的关系字段
    // database.removePendingField(this);
    // // 如果外键没有显式的创建，关系表也无反向关联字段，删除关系时，外键也删除掉
    // const tcoll = database.collections.get(this.target);
    // const foreignKey = this.options.foreignKey;
    // const field1 = collection.schema.get(foreignKey);
    // const field2 = tcoll.schema.find((field) => {
    //   return field.type === 'hasMany' && field.foreignKey === foreignKey;
    // });
    // if (!field1 && !field2) {
    //   collection.model.removeAttribute(foreignKey);
    // }
    // // 删掉 model 的关联字段
    // delete collection.model.associations[this.name];
    // // @ts-ignore
    // collection.model.refreshAttributes();
  }
}
