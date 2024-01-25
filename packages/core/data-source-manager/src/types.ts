export type CollectionOptions = {
  name: string;
  repository?: string;
  fields: any[];
  [key: string]: any;
};

export interface ICollection {
  repository: any;
  updateOptions(options: any): void;
  setField(name: string, options: any): void;
  [key: string]: any;
}
export interface IModel {
  [key: string]: any;
}

export interface IRepository {
  find(options?: any): Promise<IModel[]>;
  findOne(options?: any): Promise<IModel>;
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
  getRepository<R = IRepository>(name: string, sourceId?: string | number): R;
  sync(): Promise<void>;
}
