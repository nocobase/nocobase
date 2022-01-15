export interface AclActionOptions {
  displayName: string;
  type: 'new-data' | 'old-data';
  aliases?: string | string[];
}

export class AclAction {
  options: AclActionOptions;
  constructor(options: AclActionOptions) {
    this.options = options;
  }
}
