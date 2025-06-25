/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isTitleField } from '../../../data-source';

export const loadTitleFieldOptions = (collectionField, dataSourceManager) => {
  return async (field) => {
    const form = field.form;
    const compile = form?.designable?.compile || ((v) => v);

    const collectionManager = collectionField?.collection?.collectionManager;
    const target = collectionField?.options?.target;
    if (!collectionManager || !target) return;

    const targetCollection = collectionManager.getCollection(target);
    const targetFields = targetCollection?.getFields?.() ?? [];

    field.loading = true;

    const options = targetFields
      .filter((field) => isTitleField(dataSourceManager, field.options))
      .map((field) => ({
        value: field.name,
        label: compile(field.options.uiSchema?.title) || field.name,
      }));

    field.dataSource = options;
    field.loading = false;
  };
};
