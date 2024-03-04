export type CollectionOptions = {
  name: string;
  repository?: string;
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
  primaryKey: boolean;
  unique: boolean;
  allowNull?: boolean;
  autoIncrement?: boolean;
  [key: string]: any;
};

export interface IField {
  options: FieldOptions;
}
export interface ICollection {
  repository: any;
  updateOptions(options: any): void;
  setField(name: string, options: any): IField;
  removeField(name: string): void;
  getFields(): Array<IField>;
  getField(name: string): IField;
  [key: string]: any;
}
export interface IModel {
  [key: string]: any;
}

export interface IRepository {
  find(options?: any): Promise<IModel[]>;
  findOne(options?: any): Promise<IModel>;
  count(options?: any): Promise<Number>;
  findAndCount(options?: any): Promise<[IModel[], Number]>;
  create(options: any): void;
  update(options: any): void;
  destroy(options: any): void;
  [key: string]: any;
}

export type MergeOptions = {
  [key: string]: any;
};

export interface ICollectionManager {
  registerFieldTypes(types: Record<string, any>): void;
  registerFieldInterfaces(interfaces: Record<string, any>): void;
  registerCollectionTemplates(templates: Record<string, any>): void;
  registerModels(models: Record<string, any>): void;
  registerRepositories(repositories: Record<string, any>): void;

  getRegisteredRepository(key: string): IRepository;

  defineCollection(options: CollectionOptions): ICollection;

  extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection;

  hasCollection(name: string): boolean;
  getCollection(name: string): ICollection;

  getCollections(): Array<ICollection>;
  getRepository(name: string, sourceId?: string | number): IRepository;
  sync(): Promise<void>;
}
