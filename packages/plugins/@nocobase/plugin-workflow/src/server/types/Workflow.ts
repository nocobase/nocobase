/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Database,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  HasManyGetAssociationsMixin,
  Model,
} from '@nocobase/database';
import ExecutionModel from './Execution';
import FlowNodeModel from './FlowNode';

export default class WorkflowModel extends Model {
  declare static database: Database;

  declare id: number;
  declare key: string;
  declare title: string;
  declare enabled: boolean;
  declare current: boolean;
  declare description?: string;
  declare type: string;
  declare config: any;
  declare options: any;
  declare sync: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;

  declare nodes?: FlowNodeModel[];
  declare getNodes: HasManyGetAssociationsMixin<FlowNodeModel>;
  declare createNode: HasManyCreateAssociationMixin<FlowNodeModel>;

  declare executions?: ExecutionModel[];
  declare countExecutions: HasManyCountAssociationsMixin;
  declare getExecutions: HasManyGetAssociationsMixin<ExecutionModel>;
  declare createExecution: HasManyCreateAssociationMixin<ExecutionModel>;
}
