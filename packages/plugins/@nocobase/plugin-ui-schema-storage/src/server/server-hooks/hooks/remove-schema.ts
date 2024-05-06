/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
