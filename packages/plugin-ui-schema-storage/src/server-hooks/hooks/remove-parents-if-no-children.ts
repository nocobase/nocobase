import { UiSchemaRepository } from '../../repository';

export async function removeParentsIfNoChildren({ schemaInstance, db, options, params }) {
  const { transaction, oldParentUid } = options;
  const uiSchemaRepository: UiSchemaRepository = db.getRepository('uiSchemas');
  await uiSchemaRepository.recursivelyRemoveIfNoChildren({
    transaction,
    uid: oldParentUid,
    breakRemoveOn: params?.breakRemoveOn,
  });
}
