import { ISchema } from "@formily/react";

export interface CollectionManagerOptions {
  interfaces?: any;
  collections?: any[];
}

export interface CollectionOptions {
  name?: string;
  fields?: any[];
}

export interface ICollectionProviderProps {
  name?: string;
  fields?: any;
}

export interface CollectionFieldOptions {
  name?: any;
  uiSchema?: ISchema;
}
