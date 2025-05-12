import { observable, action, define } from '@formily/reactive';

export interface IModelComponentProps {
  [key: string]: any;
}

export class BaseModel {
  public uid: string;
  public props: IModelComponentProps;
  public hidden: { value: boolean };

  constructor(uid: string, initialProps: IModelComponentProps = {}, initialHidden = false) {
    this.uid = uid;
    this.props = initialProps;
    this.hidden = observable.ref(initialHidden);

    define(this, {
      props: observable,
      setProps: action,
      setHidden: action,
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

  getProps(): IModelComponentProps {
    return { ...this.props }; // Return a shallow copy
  }

  setHidden(hiddenVal: boolean) {
    this.hidden.value = hiddenVal;
  }

  isHidden(): boolean {
    return this.hidden.value;
  }
} 