export interface AvailableActionOptions {
  aliases?: string[] | string;
  type: 'new-data' | 'old-data';
  displayName?: string;
  resource?: string;
}

export class AclAvailableAction {
  constructor(private name: string, private options: AvailableActionOptions) {}
}
