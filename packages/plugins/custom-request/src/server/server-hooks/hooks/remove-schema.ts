import { UiSchemaRepository } from '../../repository';

export async function removeSchema({ schemaInstance, options, db, params }) {
  const { transaction } = options;
  const uiSchemaRepository: UiSchemaRepository = db.getRepository('uiSchemas');
  const uid = schemaInstance.get('x-uid') as string;

  if (params?.removeParentsIfNoChildren) {
    await uiSchemaRepository.removeEmptyParents({
      uid,
      breakRemoveOn: params['breakRemoveOn'],
      transaction,
    });
  } else {
    await uiSchemaRepository.remove(uid, {
      transaction,
    });
  }
}
