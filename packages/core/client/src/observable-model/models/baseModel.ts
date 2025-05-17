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
  private _defaultProps: IModelComponentProps | null;

  constructor(uid: string, defaultProps?: IModelComponentProps) {
    this.uid = uid;
    this._defaultProps = defaultProps ? { ...defaultProps } : null;
    this.props = {};
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

  // 获取默认属性
  getDefaultProps(): ReadonlyModelProps | null {
    return this._defaultProps;
  }

  // 设置默认属性
  setDefaultProps(props: IModelComponentProps): void {
    if (this._defaultProps === null) {
      this._defaultProps = { ...props };
    }
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
    // 创建代理对象，当属性在 props 中不存在时，尝试从 defaultProps 中读取
    const handler = {
      get: (target: IModelComponentProps, prop: string | symbol) => {
        // 如果属性存在于 props 中，直接返回
        if (prop in target) {
          return target[prop as string];
        }
        // 如果 props 中不存在，且 defaultProps 不为 null，尝试从 defaultProps 中读取
        if (this._defaultProps !== null && typeof prop === 'string' && prop in this._defaultProps) {
          return this._defaultProps[prop];
        }
        // 都不存在则返回 undefined
        return undefined;
      }
    };

    return new Proxy(this.props, handler) as ReadonlyModelProps;
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
      const flowKey = flowKeyOrParams;
      const stepKey = stepKeyOrParams;
      const currentFlowParams = this.filterParams[flowKey] || {};
      this.filterParams[flowKey] = {
        ...currentFlowParams,
        [stepKey]: params,
      };
    } 
    // 处理两个参数的情况: setFilterParams(flowKey, stepsParams)
    else if (typeof flowKeyOrParams === 'string' && typeof stepKeyOrParams === 'object' && stepKeyOrParams !== null) {
      const flowKey = flowKeyOrParams;
      const newStepsForFlow = stepKeyOrParams as Record<string, any>;
      const currentFlowParams = this.filterParams[flowKey] || {};
      this.filterParams[flowKey] = {
        ...currentFlowParams,
        ...newStepsForFlow,
      };
    } 
    // 处理一个参数的情况: setFilterParams(params)
    else if (typeof flowKeyOrParams === 'object' && flowKeyOrParams !== null) {
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
      const flowKey = flowKeyOrParams;
      const stepKey = stepKeyOrParams;
      const currentFlowParams = this.eventParams[flowKey] || {};
      this.eventParams[flowKey] = {
        ...currentFlowParams,
        [stepKey]: params,
      };
    } 
    // 处理两个参数的情况: setEventParams(flowKey, stepsParams)
    else if (typeof flowKeyOrParams === 'string' && typeof stepKeyOrParams === 'object' && stepKeyOrParams !== null) {
      const flowKey = flowKeyOrParams;
      const newStepsForFlow = stepKeyOrParams as Record<string, any>;
      const currentFlowParams = this.eventParams[flowKey] || {};
      this.eventParams[flowKey] = {
        ...currentFlowParams,
        ...newStepsForFlow,
      };
    } 
    // 处理一个参数的情况: setEventParams(params)
    else if (typeof flowKeyOrParams === 'object' && flowKeyOrParams !== null) {
      this.eventParams = { ...this.eventParams, ...flowKeyOrParams };
    }
  }
} 