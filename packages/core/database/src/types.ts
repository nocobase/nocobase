import { Model } from './model';

export type CollectionNameType = string;

export type ValidationOptions = {
  skip?: string[];
  fields?: string[];
  hooks?: boolean;
  [key: string]: any;
};

export type ListenerReturn = Promise<void> | void;

export type ValidateListener = (model: Model, options?: ValidationOptions) => ListenerReturn;
