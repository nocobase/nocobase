import { Model, HasManyGetAssociationsMixin, HasManyCreateAssociationMixin } from 'sequelize';

import Database from '@nocobase/database';

import { get as getTrigger } from '../triggers';
import { EXECUTION_STATUS } from '../constants';
import ExecutionModel from './Execution';
import FlowNodeModel from './FlowNode';

export default class WorkflowModel extends Model {
  declare static database: Database;

  declare id: number;
  declare title: string;
  declare enabled: boolean;
  declare description?: string;
  declare type: string;
  declare config: any;

  declare createdAt: Date;
  declare updatedAt: Date;

  declare nodes: FlowNodeModel[];
  declare getNodes: HasManyGetAssociationsMixin<FlowNodeModel>;
  declare createNode: HasManyCreateAssociationMixin<FlowNodeModel>;

  declare executions: ExecutionModel[];
  declare getExecutions: HasManyGetAssociationsMixin<ExecutionModel>;
  declare createExecution: HasManyCreateAssociationMixin<ExecutionModel>;

  static async mount() {
    const collection = this.database.getCollection('workflows');
    const workflows = await collection.repository.find({
      filter: { enabled: true }
    });

    workflows.forEach(workflow => {
      // @ts-ignore
      workflow.mount();
    });

    this.addHook('afterCreate', (model: WorkflowModel) => model.mount());
    // TODO: afterUpdate, afterDestroy
  }

  async mount() {
    if (!this.get('enabled')) {
      return;
    }
    const type = this.get('type');
    const config = this.get('config');
    const trigger = getTrigger(type);
    trigger.call(this, config, this.start.bind(this));
  }

  // TODO
  async unmount() {
    
  }

  async start(context: Object, options) {
    // `null` means not to trigger
    if (context === null) {
      return;
    }

    const execution = await this.createExecution({
      context,
      status: EXECUTION_STATUS.STARTED
    });

    execution.workflow = this;

    await execution.start(options);
    return execution;
  }
}
