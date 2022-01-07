import { TargetKey, Values } from '../repository';
import { Transactionable } from 'sequelize';

export type PrimaryKeyWithThroughValues = [TargetKey, Values];

export interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[];
}

export type setAssociationOptions =
  | TargetKey
  | TargetKey[]
  | PrimaryKeyWithThroughValues
  | PrimaryKeyWithThroughValues[]
  | AssociatedOptions;
