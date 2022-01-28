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

    workflows.forEach((workflow: WorkflowModel) => {
      workflow.toggle();
    });

    this.addHook('afterCreate', (model: WorkflowModel) => model.toggle());
    this.addHook('afterUpdate', (model: WorkflowModel) => model.toggle());
    this.addHook('afterDestroy', (model: WorkflowModel) => model.toggle(false));
  }

  getHookId() {
    return `workflow-${this.get('id')}`;
  }

  async toggle(enable?: boolean) {
    const type = this.get('type');
    const { on, off } = getTrigger(type);
    if (typeof enable !== 'undefined' ? enable : this.get('enabled')) {
      on.call(this, this.start.bind(this));
    } else {
      off.call(this);
    }
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
