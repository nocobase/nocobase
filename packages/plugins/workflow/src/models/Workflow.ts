import { Database, Model } from '@nocobase/database';
import { HasManyCountAssociationsMixin, HasManyCreateAssociationMixin, HasManyGetAssociationsMixin, Transactionable } from 'sequelize';

import { EXECUTION_STATUS } from '../constants';
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

  getTransaction(options) {
    if (!this.useTransaction) {
      return null;
    }

    return options.transaction && !options.transaction.finished
      ? options.transaction
      : (<typeof WorkflowModel>this.constructor).database.sequelize.transaction();
  }

  trigger = async (context: Object, options = {}) => {
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
      key: this.key,
      status: EXECUTION_STATUS.STARTED,
      useTransaction: this.useTransaction,
      transaction: transaction.id
    }, { transaction });

    const executed = await this.countExecutions({ transaction });

    // NOTE: not to trigger afterUpdate hook here
    await this.update({ executed }, { transaction, hooks: false });

    const allExecuted = await (<typeof ExecutionModel>execution.constructor).count({
      where: {
        key: this.key
      },
      transaction
    });
    await (<typeof WorkflowModel>this.constructor).update({
      allExecuted
    }, {
      where: {
        key: this.key
      },
      transaction
    });

    execution.workflow = this;

    await execution.start({ transaction });

    // @ts-ignore
    if (transaction && (!options.transaction || options.transaction.finished)) {
      await transaction.commit();
    }

    return execution;
  }
}
