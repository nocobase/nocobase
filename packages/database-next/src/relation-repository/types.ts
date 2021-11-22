import {
  AssociationKeysToBeUpdate,
  BlackList,
  Filter,
  TransactionAble,
  Values,
  WhiteList,
} from '../repository';
import {
  Transactionable,
  FindOptions as SequelizeFindOptions,
} from 'sequelize';

type CreateOptions = {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
};

interface FindOptions extends SequelizeFindOptions {
  // 数据过滤
  filter?: Filter;
  // 输出结果显示哪些字段
  fields?: string[];
  // 输出结果不显示哪些字段
  except?: string[];
  // 附加字段，用于控制关系字段的输出
  appends?: string[];
  // 排序，字段前面加上 “-” 表示降序
  sort?: string[];
}

type FindAndCountOptions = any;
type FindOneOptions = any;
type CountOptions = any;

interface DestroyOptions extends TransactionAble {
  filter?: Filter;
  filterByPk?: PK;
}

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
