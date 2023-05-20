import type { Database} from '@nocobase/database';
import { Model, Op } from '@nocobase/database';
import type {
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  HasManyGetAssociationsMixin} from 'sequelize';
import {
  Transactionable,
} from 'sequelize';

import type ExecutionModel from './Execution';
import type FlowNodeModel from './FlowNode';

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
  declare useTransaction: boolean;
  declare executed: number;

  declare createdAt: Date;
  declare updatedAt: Date;

  declare nodes: FlowNodeModel[];
  declare getNodes: HasManyGetAssociationsMixin<FlowNodeModel>;
  declare createNode: HasManyCreateAssociationMixin<FlowNodeModel>;

  declare executions: ExecutionModel[];
  declare countExecutions: HasManyCountAssociationsMixin;
  declare getExecutions: HasManyGetAssociationsMixin<ExecutionModel>;
  declare createExecution: HasManyCreateAssociationMixin<ExecutionModel>;
}
