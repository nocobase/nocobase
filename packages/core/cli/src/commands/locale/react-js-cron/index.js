/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

exports.getReactJsCron = (lang) => {
  const langs = {
    'en-US': require('./en-US.json'),
    'zh-CN': require('./zh-CN.json'),
    'ru-RU': require('./ru-RU.json'),
    'z-TW': require('./zh-TW.json'),
  }
  return langs[lang] || langs['en-US'];
}
