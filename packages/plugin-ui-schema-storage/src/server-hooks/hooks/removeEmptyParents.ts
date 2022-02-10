import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { hookFactory } from './factory';

// given a child uid, if it is a single child ,return its parent
async function isSingleChild(uid, db, transaction) {
  const parent = await db.getRepository('ui_schema_tree_path').findOne({
    filter: {
      descendant: uid,
      depth: 1,
    },
  });

  const countResult = await db.sequelize.query(
    `SELECT COUNT(*) FROM ${
      db.getCollection('ui_schema_tree_path').model.tableName
    } where ancestor = :ancestor and depth  = 1`,
    {
      replacements: {
        ancestor: parent.get('ancestor'),
      },
      type: 'SELECT',
      transaction,
    },
  );

  const parentChildrenCount = countResult[0]['count'];

  if (parentChildrenCount == 1) {
    return parent.get('ancestor');
  }

  return null;
}

async function removeEmptyParents({ schemaInstance, options, db }) {
  const { transaction } = options;
  const uiSchemaRepository: UiSchemaRepository = db.getRepository('ui_schemas');
  const uid = schemaInstance.get('uid');

  // find parent uid
  const parentUid = await isSingleChild(uid, db, transaction);

  if (parentUid) {
    const rowUid = await isSingleChild(parentUid, db, transaction);
    if (rowUid) {
      await uiSchemaRepository.remove(rowUid, { transaction });
    } else {
      await uiSchemaRepository.remove(parentUid, { transaction });
    }
  } else {
    await uiSchemaRepository.remove(uid, { transaction });
  }
}

export default hookFactory('onCollectionFieldDestroy', 'removeEmptyParents', removeEmptyParents);
