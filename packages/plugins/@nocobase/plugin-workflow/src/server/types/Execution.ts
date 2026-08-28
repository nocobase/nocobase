/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BelongsToGetAssociationMixin, Database, HasManyGetAssociationsMixin, Model } from '@nocobase/database';
import JobModel from './Job';
import WorkflowModel from './Workflow';

export default class ExecutionModel extends Model {
  declare static readonly database: Database;

  declare id: number;
  declare workflowId: number;
  declare title: string;
  declare context: any;
  declare status: number;
  declare reason?: string | null;
  declare dispatched: boolean;
  declare manually?: boolean | null;
  declare parentExecutionId?: number | null;
  declare stack?: Array<number | string>;
  declare startedAt?: Date | null;
  declare expiresAt?: Date | null;
  declare output?: any;

  declare createdAt: Date;
  declare updatedAt: Date;

  declare key: string;

  declare workflow?: WorkflowModel;
  declare getWorkflow: BelongsToGetAssociationMixin<WorkflowModel>;

  declare jobs?: JobModel[];
  declare getJobs: HasManyGetAssociationsMixin<JobModel>;
}
