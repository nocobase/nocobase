/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BelongsToGetAssociationMixin, Model } from '@nocobase/database';
import FlowNodeModel from './FlowNode';

export default class JobModel extends Model {
  declare id: number;
  declare status: number;
  declare result: any;

  declare createdAt: Date;
  declare updatedAt: Date;

  declare upstreamId: number;
  declare upstream: JobModel;

  declare nodeId: number;
  declare node?: FlowNodeModel;
  declare getNode: BelongsToGetAssociationMixin<FlowNodeModel>;
}
