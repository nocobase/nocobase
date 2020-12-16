import { CreatedBy, UpdatedBy } from ".";

export function setUserValue(this: CreatedBy | UpdatedBy, model, { context }) {
  const { foreignKey } = this.options;
  // 已有数据
  if (model.getDataValue(foreignKey)) {
    return;
  }
  if (!context) {
    return;
  }
  const { currentUser } = context.state;
  if (!currentUser) {
    return;
  }
  model.setDataValue(foreignKey, currentUser.get(this.options.targetKey));
}
