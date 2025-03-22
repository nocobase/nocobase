/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createJSONTemplateParser } from '@nocobase/json-template-parser';

const parser = createJSONTemplateParser();

type ParseFilterOptions = {
  now?: any;
  timezone?: string;
  getField?: any;
};

function renderFilters(filters, data, context: ParseFilterOptions = {}) {
  return parser.render(filters, data, context);
}
