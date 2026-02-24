/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const NAMESPACE = '@nocobase/plugin-workflow-custom-action-trigger';

export const EVENT_TYPE = 'custom-action';

export const CONTEXT_TYPE = {
  GLOBAL: 0,
  SINGLE_RECORD: 1,
  MULTIPLE_RECORDS: 2,
};

export const CONTEXT_TYPE_OPTIONS = [
  {
    label: `{{t('None', { ns: "${NAMESPACE}" })}}`,
    value: CONTEXT_TYPE.GLOBAL,
    tooltip: `{{t('Could be used on non-record related action buttons. Such as buttons in workbench panel or in table blocks.', { ns: "${NAMESPACE}" })}}`,
  },
  {
    label: `{{t('Single collection record', { ns: "${NAMESPACE}" })}}`,
    value: CONTEXT_TYPE.SINGLE_RECORD,
    tooltip: `{{t('Could only be used on single record related action buttons. Such as in form, detail block and table row of record.', { ns: "${NAMESPACE}" })}}`,
  },
  {
    label: `{{t('Multiple collection records', { ns: "${NAMESPACE}" })}}`,
    value: CONTEXT_TYPE.MULTIPLE_RECORDS,
    tooltip: `{{t('Could only be used on multiple record related action buttons. Such as for batch action in table block. The data in trigger variable will be an array.', { ns: "${NAMESPACE}" })}}`,
  },
];
