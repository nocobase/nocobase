/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback } from 'react';
import { tval } from '@nocobase/utils/client';
import { Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { FormFieldModel } from './FormFieldModel';

const CollectionSelector = (props) => {
  const { filter, options, ...others } = props;
  const { t } = useTranslation();
  const optionFilter = useCallback(
    (input, option) =>
      (option?.label.toLowerCase() ?? '').includes(input.toLocaleLowerCase()) ||
      (option?.value.toString().toLowerCase() ?? '').includes(input.toLocaleLowerCase()),
    [],
  );
  return (
    <Select
      // @ts-ignore
      role="button"
      data-testid="select-collection"
      placeholder={t('Select collection')}
      popupMatchSelectWidth={false}
      {...others}
      showSearch
      filterOption={optionFilter}
      options={options}
    />
  );
};

export class CollectionSelectorFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['collection'];

  get component() {
    return [CollectionSelector, {}];
  }
}
CollectionSelectorFieldModel.registerFlow({
  key: 'collectionSelectFlow',
  sort: 5000,
  steps: {
    init: {
      handler(ctx) {
        const collections = ctx.dataSourceManager.getDataSource('main').getCollections();
        const defaultOptions = ctx.model.collectionField.uiSchema.enum;
        const options = collections
          .filter((item: any) => !item.options.hidden)
          .map((item: any) => ({
            label: ctx.t(item.title || item.label),
            value: item.name || item.value,
            color: item.category?.color,
          }));
        ctx.model.setProps({
          options: defaultOptions.length ? defaultOptions : options,
        });
      },
    },
  },
});
