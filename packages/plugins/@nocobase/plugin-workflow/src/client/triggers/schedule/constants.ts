/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NAMESPACE } from '../../locale';

export const SCHEDULE_MODE = {
  STATIC: 0,
  DATE_FIELD: 1,
};

export const scheduleModeOptions = [
  { value: SCHEDULE_MODE.STATIC, label: `{{t("Based on certain date", { ns: "${NAMESPACE}" })}}` },
  {
    value: SCHEDULE_MODE.DATE_FIELD,
    label: `{{t("Based on date field of collection", { ns: "${NAMESPACE}" })}}`,
  },
];
