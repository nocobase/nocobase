import type { Model } from './model';
import type { CreateOptions, DestroyOptions, SaveOptions, SyncOptions, UpdateOptions } from 'sequelize/types';
import { Collection, CollectionOptions } from './collection';
import { HookReturn } from 'sequelize/types/hooks';
import { ValidationOptions } from 'sequelize/types/instance-validator';

export type CollectionNameType = string;

export type ModelSyncEventType = 'beforeSync' | 'afterSync';
export type ModelValidateEventType = 'beforeValidate' | 'afterValidate';
export type ModelCreateEventType = 'beforeCreate' | 'afterCreate';
export type ModelUpdateEventType = 'beforeUpdate' | 'afterUpdate';
export type ModelSaveEventType = 'beforeSave' | 'afterSave';
export type ModelDestroyEventType = 'beforeDestroy' | 'afterDestroy';
export type ModelCreateWithAssociationsEventType = 'afterCreateWithAssociations';
export type ModelUpdateWithAssociationsEventType = 'afterUpdateWithAssociations';
export type ModelSaveWithAssociationsEventType = 'afterSaveWithAssociations';

export type ModelBulkCreateEvnetType = 'beforeBulkCreate' | 'afterBulkCreate';
export type ModelBulkUpdateEvnetType = 'beforeBulkUpdate' | 'afterBulkUpdate';
export type ModelBulkDestroyEvnetType = 'beforeBulkDestroy' | 'afterBulkDestroy';

export type ModelValidateEventTypes = ModelValidateEventType | `${CollectionNameType}.${ModelValidateEventType}`;
export type ModelCreateEventTypes = ModelCreateEventType | `${CollectionNameType}.${ModelCreateEventType}`;
export type ModelUpdateEventTypes = ModelUpdateEventType | `${CollectionNameType}.${ModelUpdateEventType}`;
export type ModelSaveEventTypes = ModelSaveEventType | `${CollectionNameType}.${ModelSaveEventType}`;
export type ModelDestroyEventTypes = ModelDestroyEventType | `${CollectionNameType}.${ModelDestroyEventType}`;
export type ModelCreateWithAssociationsEventTypes =
  | ModelCreateWithAssociationsEventType
  | `${CollectionNameType}.${ModelCreateWithAssociationsEventType}`;
export type ModelUpdateWithAssociationsEventTypes =
  | ModelUpdateWithAssociationsEventType
  | `${CollectionNameType}.${ModelUpdateWithAssociationsEventType}`;
export type ModelSaveWithAssociationsEventTypes =
  | ModelSaveWithAssociationsEventType
  | `${CollectionNameType}.${ModelSaveWithAssociationsEventType}`;

export type ModelBulkCreateEvnetTypes = ModelBulkCreateEvnetType | `${CollectionNameType}.${ModelBulkCreateEvnetType}`;
export type ModelBulkUpdateEvnetTypes = ModelBulkUpdateEvnetType | `${CollectionNameType}.${ModelBulkUpdateEvnetType}`;
export type ModelBulkDestroyEvnetTypes =
  | ModelBulkDestroyEvnetType
  | `${CollectionNameType}.${ModelBulkDestroyEvnetType}`;

export type ModelEventTypes =
  | ModelSyncEventType
  | ModelValidateEventTypes
  | ModelCreateEventTypes
  | ModelUpdateEventTypes
  | ModelSaveEventTypes
  | ModelDestroyEventTypes
  | ModelCreateWithAssociationsEventTypes
  | ModelUpdateWithAssociationsEventTypes
  | ModelSaveWithAssociationsEventTypes
  | ModelBulkCreateEvnetTypes
  | ModelBulkUpdateEvnetTypes
  | ModelBulkDestroyEvnetTypes;

export type DatabaseBeforeDefineCollectionEventType = 'beforeDefineCollection';
export type DatabaseAfterDefineCollectionEventType = 'afterDefineCollection';
export type DatabaseBeforeRemoveCollectionEventType = 'beforeRemoveCollection';
export type DatabaseAfterRemoveCollectionEventType = 'afterRemoveCollection';

export type DatabaseEventTypes =
  | DatabaseBeforeDefineCollectionEventType
  | DatabaseAfterDefineCollectionEventType
  | DatabaseBeforeRemoveCollectionEventType
  | DatabaseAfterRemoveCollectionEventType;

export type EventType = ModelEventTypes | DatabaseEventTypes | string;

export type { HookReturn };

export type SyncListener = (options?: SyncOptions) => HookReturn;
export type ValidateListener = (model: Model, options?: ValidationOptions) => HookReturn;
export type CreateListener = (model: Model, options?: CreateOptions) => HookReturn;
export type UpdateListener = (model: Model, options?: UpdateOptions) => HookReturn;
export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
export type DestroyListener = (model: Model, options?: DestroyOptions) => HookReturn;
export type CreateWithAssociationsListener = (model: Model, options?: CreateOptions) => HookReturn;
export type UpdateWithAssociationsListener = (model: Model, options?: UpdateOptions) => HookReturn;
export type SaveWithAssociationsListener = (model: Model, options?: SaveOptions) => HookReturn;

export type BeforeDefineCollectionListener = (options: CollectionOptions) => void;
export type AfterDefineCollectionListener = (collection: Collection) => void;
export type RemoveCollectionListener = (collection: Collection) => void;
