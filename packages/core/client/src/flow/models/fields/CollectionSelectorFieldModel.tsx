/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback } from 'react';
import { Select } from 'antd';
import { castArray } from 'lodash';
import { EditableItemModel } from '@nocobase/flow-engine';
import { useTranslation } from 'react-i18next';
import { FieldModel } from '../base';

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

export class CollectionSelectorFieldModel extends FieldModel {
  render() {
    return <CollectionSelector {...this.props} />;
  }
}
CollectionSelectorFieldModel.registerFlow({
  key: 'collectionSelectFlow',
  sort: 5000,
  steps: {
    init: {
      handler(ctx) {
        if (ctx.model.props.isTableOid) {
          const childCollections = ctx.dataSourceManager
            .getDataSource('main')
            .collectionManager.getChildrenCollections(ctx.collectionField.collectionName);
          const options = castArray(ctx.collectionField.collection)
            .concat(childCollections)
            .map((item) => {
              return {
                label: item.title || item.name,
                value: item.name || item.value,
              };
            });
          ctx.model.setProps({
            options: options,
          });
        } else {
          const collections = ctx.dataSourceManager.getDataSource('main').getCollections();
          const defaultOptions = ctx.model.context.collectionField.enum || [];
          const options = collections
            .filter((item: any) => !item.options.hidden)
            .filter((v) => {
              if (defaultOptions.length) {
                return defaultOptions.find((c) => c.value === v.name);
              }
              return true;
            })
            .map((item: any) => ({
              label: item.title || item.name,
              value: item.name || item.value,
              color: item.category?.color,
            }));
          ctx.model.setProps({
            options: options,
          });
        }
      },
    },
  },
});

EditableItemModel.bindModelToInterface('CollectionSelectorFieldModel', ['collection', 'tableoid'], {
  isDefault: true,
});
