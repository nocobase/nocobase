import { Model } from '@nocobase/database';
import { BelongsToGetAssociationMixin } from 'sequelize';
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