/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Repository } from '@nocobase/database';
import { DEFAULT_ADMIN_UI_LAYOUT, UI_LAYOUT_TYPE_DESKTOP, UI_LAYOUT_TYPE_MOBILE } from '../constants';

type UiLayoutRecord = Partial<typeof DEFAULT_ADMIN_UI_LAYOUT> & {
  id: number | string;
  uid: string;
  layoutType?: string;
  routeName?: string;
};

function getFallbackTitle(record: UiLayoutRecord) {
  if (record.uid === DEFAULT_ADMIN_UI_LAYOUT.uid) {
    return DEFAULT_ADMIN_UI_LAYOUT.title;
  }
  if (record.layoutType === UI_LAYOUT_TYPE_MOBILE) {
    return 'Mobile layout';
  }
  if (record.layoutType === UI_LAYOUT_TYPE_DESKTOP) {
    return 'Desktop layout';
  }
  return record.routeName || record.uid;
}

async function ensureUiLayoutTitles(repository: Repository<UiLayoutRecord>) {
  const records = await repository.find({});
  for (const record of records) {
    if (record.get('title')) {
      continue;
    }

    await repository.update({
      filterByTk: record.get('id'),
      values: {
        title: getFallbackTitle(record.toJSON() as UiLayoutRecord),
      },
    });
  }
}

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
    await ensureUiLayoutTitles(repository);
    return;
  }

  const values: Partial<typeof DEFAULT_ADMIN_UI_LAYOUT> = {};
  if (!existed.get('layoutType')) {
    values.layoutType = DEFAULT_ADMIN_UI_LAYOUT.layoutType;
  }
  if (!existed.get('title')) {
    values.title = DEFAULT_ADMIN_UI_LAYOUT.title;
  }

  if (Object.keys(values).length) {
    await repository.update({
      filterByTk: existed.get('id'),
      values,
    });
  }

  await ensureUiLayoutTitles(repository);
}
