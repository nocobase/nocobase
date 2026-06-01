/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Repository } from '@nocobase/database';
import { DEFAULT_ADMIN_UI_LAYOUT } from '../constants';

type UiLayoutRecord = typeof DEFAULT_ADMIN_UI_LAYOUT & {
  id: number | string;
};

export async function ensureDefaultUiLayout(db: Database) {
  const repository = db.getRepository('uiLayouts') as Repository<UiLayoutRecord>;
  const existed = await repository.findOne({
    filter: {
      uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
    },
  });

  if (!existed) {
    await repository.create({
      values: DEFAULT_ADMIN_UI_LAYOUT,
    });
    return;
  }

  if (!existed.get('layoutType')) {
    await repository.update({
      filterByTk: existed.get('id'),
      values: {
        layoutType: DEFAULT_ADMIN_UI_LAYOUT.layoutType,
      },
    });
  }
}
