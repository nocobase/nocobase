/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getLoggerLevel, getLoggerTransport } from '@nocobase/logger';
import { AppLoggerOptions } from '@nocobase/server';

export default {
  request: {
    transports: getLoggerTransport(),
    level: getLoggerLevel(),
  },
  system: {
    transports: getLoggerTransport(),
    level: getLoggerLevel(),
  },
} as AppLoggerOptions;
