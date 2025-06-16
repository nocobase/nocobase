import type { IModelComponentProps } from '../types';
import { FlowModel } from './flowModel';

/**
 * ForkFlowModel 作为 FlowModel 的轻量代理实例：
 *  - 共享 master（原始 FlowModel）上的所有业务数据与方法
 *  - 仅在 props 层面拥有本地覆盖(localProps)，其余字段全部透传到 master
 *  - 不会被注册到 FlowEngine.modelInstances 中，保持 uid → master 唯一性假设
 */
export class ForkFlowModel<TMaster extends FlowModel = FlowModel> {
  /** 与 master 相同的 UID，用于日志调试 */
  public readonly uid: string;
  /** 调试标识，便于在日志或断言中快速识别 */
  public readonly isFork = true;

  /** 本地覆盖的 props，fork 层面的 UI/状态 */
  public localProps: IModelComponentProps;

  /** master 引用 */
  private master: TMaster;

  /** 是否已被释放 */
  private disposed = false;

  /** fork 在 master.forks 中的索引 */
  public readonly forkId: number;

  constructor(master: TMaster, initialProps: IModelComponentProps = {}, forkId: number = 0) {
    this.master = master;
    this.uid = master.uid;
    this.localProps = { ...initialProps };
    this.forkId = forkId;

    // 返回代理对象，实现自动透传
    return new Proxy(this, {
      get: (target: any, prop: PropertyKey, receiver: any) => {
        // disposed check
        if (prop === 'disposed') return target.disposed;

        // fork 自身属性 / 方法优先
        if (prop in target) {
          if (prop === 'props') {
            // 对 props 做合并返回
            return { ...target.master.getProps(), ...target.localProps };
          }
          return Reflect.get(target, prop, receiver);
        }

        // 默认取 master 上的值
        const value = (target.master as any)[prop];

        // 如果是函数，需要绑定 master，保持 this 指向
        if (typeof value === 'function') {
          return value.bind(target.master);
        }
        return value;
      },
      set: (target: any, prop: PropertyKey, value: any, receiver: any) => {
        if (prop === 'props') {
          return true;
        }

        // 如果 fork 自带字段，则写到自身（例如 localProps）
        if (prop in target) {
          // @ts-ignore
          target[prop] = value;
          return true;
        }

        // 其余写入 master，实现共享
        (target.master as any)[prop] = value;
        return true;
      },
    });
  }

  /**
   * 修改局部 props，仅影响当前 fork
   */
  setProps(key: string | IModelComponentProps, value?: any): void {
    if (this.disposed) return;

    if (typeof key === 'string') {
      this.localProps[key] = value;
    } else {
      this.localProps = { ...this.localProps, ...key };
    }
  }

  /**
   * render 依旧使用 master 的方法，但合并后的 props 需要透传
   */
  render() {
    if (this.disposed) return null;
    // 将 master.render 以 fork 作为 this 调用，使其读取到合并后的 props
    const mergedProps = { ...this.master.getProps(), ...this.localProps };
    // 临时替换 this.props
    const originalProps = (this as any).props;
    (this as any).props = mergedProps;
    try {
      return (this.master.render as any).call(this);
    } finally {
      (this as any).props = originalProps;
    }
  }

  /**
   * 释放 fork：从 master.forks 中移除自身并断开引用
   */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.master && (this.master as any).forks) {
      (this.master as any).forks.delete(this as any);
    }
    // @ts-ignore
    this.master = null;
  }

  /**
   * 获取合并后的 props（master + localProps，local 优先）
   */
  getProps(): IModelComponentProps {
    return { ...this.master.getProps(), ...this.localProps };
  }
}

// 类型断言：让 ForkFlowModel 可以被当作 FlowModel 使用
export interface ForkFlowModel<TMaster extends FlowModel = FlowModel> extends FlowModel {} 