/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AddNewActionModel, ViewActionModel } from '@nocobase/client';
import { tExpr } from '@nocobase/flow-engine';

export const createCalendarQuickCreateActionOptions = (uid?: string) => {
  return {
    uid,
    use: 'CalendarQuickCreateActionModel',
  };
};

export const createCalendarEventViewActionOptions = (uid?: string) => {
  return {
    uid,
    use: 'CalendarEventViewActionModel',
  };
};

export class CalendarQuickCreateActionModel extends AddNewActionModel {
  defaultPopupTitle = tExpr('Add new', { ns: 'calendar' });
}

CalendarQuickCreateActionModel.define({
  hide: true,
  createModelOptions: async () => {
    return createCalendarQuickCreateActionOptions();
  },
});

export class CalendarEventViewActionModel extends ViewActionModel {
  defaultPopupTitle = tExpr('View record', { ns: 'calendar' });
}

CalendarEventViewActionModel.define({
  hide: true,
  createModelOptions: async () => {
    return createCalendarEventViewActionOptions();
  },
});
