import { useMemo } from 'react';
import { BaseModel, IModelComponentProps } from '../models/baseModel';
import { observableModelManager, ModelConstructor } from '../observableModelManager';

export interface UseObservableModelOptions<T extends BaseModel> {
  ModelClass?: ModelConstructor<T>;
  initialProps?: IModelComponentProps;
}

export function useObservableModel<T extends BaseModel = BaseModel>(
  uid: string,
  options?: UseObservableModelOptions<T>,
): T {
  const modelInstance = useMemo(() => {
    if (!uid) {
      console.warn('useObservableModel was called without a UID.');
      return null;
    }
    return observableModelManager.getModel<T>(uid, {
      ModelClass: options?.ModelClass,
      initialProps: options?.initialProps,
    });
  }, [uid]);

  return modelInstance;
} 