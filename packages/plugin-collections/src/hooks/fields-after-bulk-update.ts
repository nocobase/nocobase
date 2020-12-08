import { Model, ModelCtor } from '@nocobase/database';

/**
 * 字段导入是先 create 再 bulk update 处理 fk 的
 *
 * @param options 
 */
export default async function (options: any = {}) {
  const { migrate = true, where = {}, attributes: { collection_name }, transaction } = options;
  if (migrate && collection_name) {
    const Field = this.database.getModel('fields') as ModelCtor<Model>;
    const fields = await Field.findAll({
      where,
      transaction,
    });
    for (const field of fields) {
      await field.migrate();
    }
  }
}
