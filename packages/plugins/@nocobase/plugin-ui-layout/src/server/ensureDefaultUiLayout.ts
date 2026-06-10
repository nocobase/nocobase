/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Repository } from '@nocobase/database';
import type { Transaction } from 'sequelize';
import { DEFAULT_ADMIN_UI_LAYOUT, UI_LAYOUT_TYPE_DESKTOP, UI_LAYOUT_TYPE_MOBILE } from '../constants';

const GENERATED_DEFAULT_TITLE = 'Untitled';

type UiLayoutRecord = {
  uid: string;
  title?: string;
  layoutType?: string;
  routeName?: string;
  routePath?: string;
  authCheck?: boolean;
  enabled?: boolean;
};

const DEFAULT_ADMIN_UI_LAYOUT_PROTECTED_FIELDS = [
  'layoutType',
  'routeName',
  'routePath',
  'authCheck',
  'enabled',
] as const;

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

function shouldBackfillTitle(title: unknown) {
  return !title || title === GENERATED_DEFAULT_TITLE;
}

async function ensureUiLayoutTitles(repository: Repository<UiLayoutRecord>, transaction: Transaction) {
  const records = await repository.find({ transaction });
  for (const record of records) {
    if (!shouldBackfillTitle(record.get('title'))) {
      continue;
    }

    await repository.update({
      filterByTk: record.get('uid'),
      values: {
        title: getFallbackTitle(record.toJSON() as UiLayoutRecord),
      },
      transaction,
    });
  }
}

export async function ensureDefaultUiLayout(db: Database) {
  await db.sequelize.transaction(async (transaction) => {
    const repository = db.getRepository('uiLayouts') as Repository<UiLayoutRecord>;
    const existed = await repository.findOne({
      filter: {
        uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
      transaction,
    });

    if (!existed) {
      await repository.create({
        values: DEFAULT_ADMIN_UI_LAYOUT,
        transaction,
      });
      await ensureUiLayoutTitles(repository, transaction);
      return;
    }

    const values: Partial<
      Pick<UiLayoutRecord, 'layoutType' | 'routeName' | 'routePath' | 'authCheck' | 'enabled' | 'title'>
    > = {};
    for (const field of DEFAULT_ADMIN_UI_LAYOUT_PROTECTED_FIELDS) {
      if (existed.get(field) !== DEFAULT_ADMIN_UI_LAYOUT[field]) {
        Object.assign(values, {
          [field]: DEFAULT_ADMIN_UI_LAYOUT[field],
        });
      }
    }
    if (shouldBackfillTitle(existed.get('title'))) {
      values.title = DEFAULT_ADMIN_UI_LAYOUT.title;
    }

    if (Object.keys(values).length) {
      await repository.update({
        filterByTk: existed.get('uid'),
        values,
        transaction,
      });
    }

    await ensureUiLayoutTitles(repository, transaction);
  });
}
