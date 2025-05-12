import { BaseModel, IModelComponentProps } from './models/baseModel';

export interface ModelConstructor<T extends BaseModel> {
  new (uid: string, initialProps?: IModelComponentProps, ...args: any[]): T;
}

class ObservableModelManager {
  private models: Map<string, BaseModel> = new Map();

  public getModel<T extends BaseModel>(
    uid: string,
    options?: {
      ModelClass?: ModelConstructor<T>;
      initialProps?: IModelComponentProps;
    },
  ): T {
    if (!this.models.has(uid)) {
      const ModelToUse = options?.ModelClass || BaseModel;
      const newModel = new ModelToUse(uid, options?.initialProps) as T;
      this.models.set(uid, newModel);
      return newModel;
    }
    return this.models.get(uid) as T;
  }

  public removeModel(uid: string): boolean {
    return this.models.delete(uid);
  }

  public hasModel(uid: string): boolean {
    return this.models.has(uid);
  }
}

export const observableModelManager = new ObservableModelManager(); 