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

  constructor(uid: string, initialProps: IModelComponentProps = {}) {
    this.uid = uid;
    this.props = initialProps;
    this.hidden = false;

    define(this, {
      props: observable,
      hidden: observable,
      setProps: action,
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
} 