/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionTemplate } from '../../data-source/collection-template/CollectionTemplate';
import { getConfigurableProperties } from './properties';

export class GeneralCollectionTemplate extends CollectionTemplate {
  name = 'general';
  title = '{{t("General collection")}}';
  order = 1;
  color = 'blue';
  default = {
    fields: [],
  };
  configurableProperties = getConfigurableProperties(
    'title',
    'name',
    'inherits',
    'category',
    'description',
    'simplePaginate',
    'presetFields',
  );
}
