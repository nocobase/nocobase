import { observable, action, define } from '@formily/reactive';

export interface IModelComponentProps {
  [key: string]: any;
}

// 定义只读版本的props类型
export type ReadonlyModelProps = Readonly<IModelComponentProps>;

export class BaseModel {
  public uid: string;
  public props: IModelComponentProps;
  public hidden: boolean;
  public filterParams: Record<string, Record<string, any>>;
  public eventParams: Record<string, Record<string, any>>;

  constructor(uid: string, initialProps: IModelComponentProps = {}) {
    this.uid = uid;
    this.props = initialProps;
    this.hidden = false;
    this.filterParams = {};
    this.eventParams = {};

    define(this, {
      props: observable,
      hidden: observable,
      filterParams: observable,
      eventParams: observable,
      setProps: action,
      setFilterParams: action,
      setEventParams: action,
    });
  }

  setProps(props: IModelComponentProps): void;
  setProps(key: string, value: any): void;
  setProps(props: IModelComponentProps | string, value?: any): void {
    if (typeof props === 'string') {
      // 如果是两个参数形式: setProps(key, value)
      this.props[props] = value;
    } else {
      // 如果是一个参数形式: setProps(newProps)，完全覆盖现有props
      this.props = { ...props };
    }
  }

  getProps(): ReadonlyModelProps {
    return this.props;
  }

  // 为特定flowKey和stepKey设置过滤器参数
  setFilterParams(flowKey: string, stepKey: string, params: any): void;
  // 为特定flowKey设置所有步骤的参数
  setFilterParams(flowKey: string, stepsParams: Record<string, any>): void;
  // 批量设置多个flow的参数
  setFilterParams(params: Record<string, Record<string, any>>): void;
  
  setFilterParams(
    flowKeyOrParams: string | Record<string, Record<string, any>>, 
    stepKeyOrParams?: string | Record<string, any>, 
    params?: any
  ): void {
    // 处理三个参数的情况: setFilterParams(flowKey, stepKey, params)
    if (typeof flowKeyOrParams === 'string' && typeof stepKeyOrParams === 'string' && params !== undefined) {
      if (!this.filterParams[flowKeyOrParams]) {
        this.filterParams[flowKeyOrParams] = {};
      }
      this.filterParams[flowKeyOrParams][stepKeyOrParams] = params;
    } 
    // 处理两个参数的情况: setFilterParams(flowKey, stepsParams)
    else if (typeof flowKeyOrParams === 'string' && typeof stepKeyOrParams === 'object') {
      if (!this.filterParams[flowKeyOrParams]) {
        this.filterParams[flowKeyOrParams] = {};
      }
      this.filterParams[flowKeyOrParams] = { 
        ...this.filterParams[flowKeyOrParams], 
        ...stepKeyOrParams 
      };
    } 
    // 处理一个参数的情况: setFilterParams(params)
    else if (typeof flowKeyOrParams === 'object') {
      this.filterParams = { ...this.filterParams, ...flowKeyOrParams };
    }
  }

  // 为特定flowKey和stepKey设置事件参数
  setEventParams(flowKey: string, stepKey: string, params: any): void;
  // 为特定flowKey设置所有步骤的参数
  setEventParams(flowKey: string, stepsParams: Record<string, any>): void;
  // 批量设置多个flow的参数
  setEventParams(params: Record<string, Record<string, any>>): void;
  
  setEventParams(
    flowKeyOrParams: string | Record<string, Record<string, any>>, 
    stepKeyOrParams?: string | Record<string, any>, 
    params?: any
  ): void {
    // 处理三个参数的情况: setEventParams(flowKey, stepKey, params)
    if (typeof flowKeyOrParams === 'string' && typeof stepKeyOrParams === 'string' && params !== undefined) {
      if (!this.eventParams[flowKeyOrParams]) {
        this.eventParams[flowKeyOrParams] = {};
      }
      this.eventParams[flowKeyOrParams][stepKeyOrParams] = params;
    } 
    // 处理两个参数的情况: setEventParams(flowKey, stepsParams)
    else if (typeof flowKeyOrParams === 'string' && typeof stepKeyOrParams === 'object') {
      if (!this.eventParams[flowKeyOrParams]) {
        this.eventParams[flowKeyOrParams] = {};
      }
      this.eventParams[flowKeyOrParams] = { 
        ...this.eventParams[flowKeyOrParams], 
        ...stepKeyOrParams 
      };
    } 
    // 处理一个参数的情况: setEventParams(params)
    else if (typeof flowKeyOrParams === 'object') {
      this.eventParams = { ...this.eventParams, ...flowKeyOrParams };
    }
  }
} 