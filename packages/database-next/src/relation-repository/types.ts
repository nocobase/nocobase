import { Values } from '../repository';
import { Transactionable } from 'sequelize';

export type PrimaryKey = string | number;
export type PK = PrimaryKey | PrimaryKey[];
export type PrimaryKeyWithThroughValues = [PrimaryKey, Values];

export interface AssociatedOptions extends Transactionable {
  pk?:
    | PrimaryKey
    | PrimaryKey[]
    | PrimaryKeyWithThroughValues
    | PrimaryKeyWithThroughValues[];
}

export type setAssociationOptions =
  | PrimaryKey
  | PrimaryKey[]
  | PrimaryKeyWithThroughValues
  | PrimaryKeyWithThroughValues[]
  | AssociatedOptions;
