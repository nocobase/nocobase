/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createSelectSchemaSettingsItem } from "@nocobase/client";
import { generateNTemplate } from "../../locale";

export const recordsCountFieldSchemaSettingsItem = createSelectSchemaSettingsItem({
  name: 'recordsCount',
  title: generateNTemplate('Root records per page'),
  options: [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: '200', value: 200 },
    { label: '500', value: 500 },
  ],
  schemaKey: 'x-decorator-props.params.pageSize',
  defaultValue: 200,
});
