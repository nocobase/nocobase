/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { get } from 'lodash';
import { i18nt } from '../../locale';
export { formatDate, getLunarDay } from '../../shared/calendar';

export const toEvents = (data: any[], fieldNames: any) => {
  return data?.map((item) => {
    return {
      id: get(item, fieldNames.id || 'id'),
      title: get(item, fieldNames.title) || i18nt('Untitle'),
      start: new Date(get(item, fieldNames.start)),
      end: new Date(get(item, fieldNames.end || fieldNames.start)),
    };
  });
};
