/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import profile from './profile';

export default {
  username: 'dex',
  description: 'AI employee for extract and structure data from text, and can fill forms automatically.',
  profile,
  skillSettings: {
    skills: [
      {
        name: 'getDataSources',
        autoCall: true,
      },
      {
        name: 'getCollectionNames',
        autoCall: true,
      },
      {
        name: 'getCollectionMetadata',
        autoCall: true,
      },
    ],
  },
};
