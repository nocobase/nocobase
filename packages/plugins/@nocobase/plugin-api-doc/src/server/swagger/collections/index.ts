/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection } from '@nocobase/database';
import paths from './paths';
import components from './components';
import tags from './tags';

function collectionToSwaggerObject(collection: Collection, options) {
  return {
    paths: paths(collection, options),
    components: components(collection, options),
    tags: tags(collection, options),
  };
}

export default collectionToSwaggerObject;
