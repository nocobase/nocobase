/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type CollectionOptions = {
  name: string;
  repository?: string;
  filterTargetKey?: string | Array<string>;
  fields: any[];
  [key: string]: any;
};

export type FieldOptions = {
  name: string;
  field: string;
  rawType: string;
  type: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
  possibleTypes?: string[];
  defaultValue?: any;
  primaryKey?: boolean;
  unique?: boolean;
  allowNull?: boolean;
  autoIncrement?: boolean;
  [key: string]: any;
};

export interface IField {
  options: FieldOptions;

  isRelationField(): boolean;
}

export interface IRelationField extends IField {
  targetCollection(): ICollection;
}

export interface IFieldInterface {
  options: FieldOptions;

  toString(value: any, ctx?: any): string;

  toValue(str: string, ctx?: any): any;
}

export type FindOptions = any;

export interface ICollection {
  repository: IRepository;

  updateOptions(options: CollectionOptions, mergeOptions?: MergeOptions): void;

  setField(name: string, options: any): IField;

  removeField(name: string): void;

  getFields(): Array<IField>;

  getField(name: string): IField;

  getFieldByField(field: string): IField;

  [key: string]: any;

  unavailableActions?: () => string[];
  availableActions?: () => string[];
}

export interface IModel {
  toJSON: () => any;

  [key: string]: any;
}

export interface IRepository {
  find(options?: FindOptions): Promise<IModel[]>;

  findOne(options?: any): Promise<IModel>;

  count(options?: any): Promise<Number>;

  findAndCount(options?: any): Promise<[IModel[], Number]>;

  create(options: any): any;

  update(options: any): any;

  destroy(options: any): any;

  [key: string]: any;
}

export type MergeOptions = {
  [key: string]: any;
};

export interface ICollectionManager {
  registerFieldTypes(types: Record<string, any>): void;

  registerFieldInterfaces(interfaces: Record<string, new (options: any) => IFieldInterface>): void;

  registerFieldInterface(name: string, fieldInterface: new (options: any) => IFieldInterface): void;

  getFieldInterface(name: string): new (options: any) => IFieldInterface | undefined;

  registerCollectionTemplates(templates: Record<string, any>): void;

  registerModels(models: Record<string, any>): void;

  registerRepositories(repositories: Record<string, new (collection: ICollection) => IRepository>): void;

  getRegisteredRepository(key: string): new (collection: ICollection) => IRepository;

  defineCollection(options: CollectionOptions): ICollection;

  extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection;

  hasCollection(name: string): boolean;

  getCollection(name: string): ICollection;

  getCollections(): Array<ICollection>;

  removeCollection(name: string): void;

  getRepository(name: string, sourceId?: string | number): IRepository;

  sync(): Promise<void>;
}
