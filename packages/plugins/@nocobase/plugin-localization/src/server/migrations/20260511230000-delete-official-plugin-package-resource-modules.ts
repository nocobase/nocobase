/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op } from '@nocobase/database';
import { Migration, OFFICIAL_PLUGIN_PREFIX } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<2.2.0';

  async up() {
    const textRepo = this.db.getRepository('localizationTexts');
    const translationRepo = this.db.getRepository('localizationTranslations');
    const texts = await textRepo.find({
      filter: {
        module: {
          [Op.like]: `resources.${OFFICIAL_PLUGIN_PREFIX}%`,
        },
      },
      fields: ['id'],
    });

    const textIds = texts.map((text) => text.get('id'));
    if (!textIds.length) {
      return;
    }

    await translationRepo.destroy({
      filter: {
        textId: {
          $in: textIds,
        },
      },
    });

    await textRepo.destroy({
      filterByTk: textIds,
    });
  }
}
