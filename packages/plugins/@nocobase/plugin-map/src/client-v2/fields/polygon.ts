/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr } from '../locale';
import { CommonMapFieldInterface } from './schema';

export class PolygonFieldInterface extends CommonMapFieldInterface {
  name = 'polygon';
  order = 4;
  title = tExpr('Polygon');
  description = tExpr('Polygon');
  availableTypes = ['polygon', 'json'];
  default = this.createDefault('polygon');
}
