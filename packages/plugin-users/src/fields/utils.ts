import { CreatedBy, UpdatedBy } from '.';

export function setUserValue(this: CreatedBy | UpdatedBy, model, { context }) {
  const { foreignKey } = this.options;
  // 已有外键数据（只在创建时生效）
  if (model.getDataValue(foreignKey)) {
    if (model.isNewRecord) {
      return;
    }
    const changed = model.changed();
    if (Array.isArray(changed) && changed.find((key) => key === foreignKey)) {
      return;
    }
  }
  if (!context) {
    return;
  }
  const { currentUser } = context.state;
  if (!currentUser) {
    return;
  }
  model.set(foreignKey, currentUser.get(this.options.targetKey));
}
