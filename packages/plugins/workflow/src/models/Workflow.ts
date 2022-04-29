import { Database, Model } from '@nocobase/database';
import { HasManyCountAssociationsMixin, HasManyCreateAssociationMixin, HasManyGetAssociationsMixin } from 'sequelize';

import triggers from '../triggers';
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
  declare useTransaction: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;

  declare nodes: FlowNodeModel[];
  declare getNodes: HasManyGetAssociationsMixin<FlowNodeModel>;
  declare createNode: HasManyCreateAssociationMixin<FlowNodeModel>;

  declare executions: ExecutionModel[];
  declare countExecutions: HasManyCountAssociationsMixin;
  declare getExecutions: HasManyGetAssociationsMixin<ExecutionModel>;
  declare createExecution: HasManyCreateAssociationMixin<ExecutionModel>;

  static async mount() {
    const collection = this.database.getCollection('workflows');
    const workflows = await collection.repository.find({
      filter: { enabled: true },
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

  getTransaction(options) {
    if (!this.useTransaction) {
      return undefined;
    }

    return options.transaction && !options.transaction.finished
      ? options.transaction
      : (<typeof WorkflowModel>this.constructor).database.sequelize.transaction();
  }

  async toggle(enable?: boolean) {
    const type = this.get('type');
    const { on, off } = triggers.get(type);
    if (typeof enable !== 'undefined' ? enable : this.get('enabled')) {
      on.call(this, this.trigger.bind(this));
    } else {
      off.call(this);
    }
  }

  async trigger(context: Object, options) {
    // `null` means not to trigger
    if (context === null) {
      return;
    }

    const transaction = await this.getTransaction(options);

    if (this.useTransaction) {
      const existed = await this.countExecutions({
        where: {
          transaction: transaction.id
        },
        transaction
      });

      if (existed) {
        console.warn(`workflow ${this.id} has already been triggered in same execution (${transaction.id}), and newly triggering will be skipped.`);
        return;
      }
    }

    const execution = await this.createExecution({
      context,
      status: EXECUTION_STATUS.STARTED,
      useTransaction: this.useTransaction,
      transaction: transaction.id
    }, { transaction });

    execution.workflow = this;

    await execution.start({ transaction });

    if (transaction && (!options.transaction || options.transaction.finished)) {
      await transaction.commit();
    }

    return execution;
  }
}
