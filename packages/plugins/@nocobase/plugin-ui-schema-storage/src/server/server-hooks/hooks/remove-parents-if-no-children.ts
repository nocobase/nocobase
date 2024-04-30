/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
