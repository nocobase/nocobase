import { BaseModel, IModelComponentProps } from './models/baseModel';
import { ObjectResource } from './resources/objectResource';

export interface ModelConstructor<T extends BaseModel> {
  new (uid: string, defaultProps?: IModelComponentProps, resource?: ObjectResource): T;
}

export class ObservableModelManager {
  private models: Map<string, BaseModel> = new Map();

  public getModel<T extends BaseModel>(
    uid: string,
    options?: {
      ModelClass?: ModelConstructor<T>;
      defaultProps?: IModelComponentProps;
      resource?: ObjectResource;
    },
  ): T {
    if (!this.models.has(uid)) {
      const ModelToUse = options?.ModelClass || BaseModel;
      const newModel = new ModelToUse(uid, options?.defaultProps, options?.resource) as T;
      this.models.set(uid, newModel);
      return newModel;
    }
    
    const model = this.models.get(uid);
    // 只要模型的 defaultProps 为 null 且传入了 defaultProps，就设置 defaultProps
    if (options?.defaultProps && model.getDefaultProps() === null) {
      model.setDefaultProps(options.defaultProps);
    }
    return model as T;
  }

  public removeModel(uid: string): boolean {
    return this.models.delete(uid);
  }

  public hasModel(uid: string): boolean {
    return this.models.has(uid);
  }
}

export const observableModelManager = new ObservableModelManager(); 