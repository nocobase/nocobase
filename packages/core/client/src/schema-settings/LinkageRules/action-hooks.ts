/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useTranslation } from 'react-i18next';
import { useCollectionManager_deprecated } from '../../collection-manager';
import { ActionType } from './type';

export const useLinkageCollectionFieldOptions = (collectionName: string, readPretty: boolean) => {
  const { getCollectionFields, getInterface } = useCollectionManager_deprecated();
  const fields = getCollectionFields(collectionName).filter((v) => {
    return !['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'].includes(v.name);
  });
  const { t } = useTranslation();
  const operators = [
    { label: t('Visible'), value: ActionType.Visible, selected: true, schema: {} },
    { label: t('Editable'), value: ActionType.Editable, selected: false, schema: {} },
    { label: t('Disabled'), value: ActionType.ReadOnly, selected: false, schema: {} },
    { label: t('Easy reading'), value: ActionType.ReadPretty, selected: false, schema: {} },
    { label: t('Hidden'), value: ActionType.None, selected: false, schema: {} },
    { label: t('Hidden(reserved value)'), value: ActionType.Hidden, selected: false, schema: {} },
    { label: t('Required'), value: ActionType.Required, selected: false, schema: {} },
    { label: t('Not required'), value: ActionType.InRequired, selected: false, schema: {} },
    { label: t('Value'), value: ActionType.Value, selected: false, schema: {} },
    {
      label: t('Options'),
      value: ActionType.Options,
      selected: false,
      schema: {},
    },
    { label: t('Date scope'), value: ActionType.DateScope, selected: false, schema: {} },
  ].filter((v) => {
    if (readPretty) {
      return [ActionType.Visible, ActionType.None, ActionType.Hidden].includes(v.value);
    }
    return v;
  });
  const field2option = (field, depth) => {
    const fieldInterface = getInterface(field.interface);
    if (!fieldInterface) {
      return;
    }
    const { nested, children } = fieldInterface?.filterable || {};
    const option = {
      name: field.name,
      title: field?.uiSchema?.title || field.name,
      schema: field?.uiSchema,
      interface: field.interface,
      target: field.target,
      operators:
        operators?.filter?.((operator) => {
          if (nested || children || ['formula', 'richText', 'sequence'].includes(fieldInterface.name)) {
            return operator?.value !== ActionType.Value && operator?.value !== ActionType.Options;
          }
          return true;
        }) || [],
    };
    if (field.target && depth > 2) {
      return;
    }
    if (depth > 2) {
      return option;
    }
    return option;
  };
  const getOptions = (fields, depth) => {
    const options = [];
    fields.forEach((field) => {
      const option = field2option(field, depth);
      if (option) {
        options.push(option);
      }
    });
    return options;
  };
  return getOptions(fields, 1);
};
