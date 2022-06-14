export interface AvailableActionOptions {
  /**
   * @deprecated
   */
  type?: 'new-data' | 'old-data';
  displayName?: string;
  aliases?: string[] | string;
  resource?: string;
  // 对新数据进行操作
  onNewRecord?: boolean;
  // 允许配置字段
  allowConfigureFields?: boolean;
}

export class AclAvailableAction {
  constructor(public name: string, public options: AvailableActionOptions) {}
}
