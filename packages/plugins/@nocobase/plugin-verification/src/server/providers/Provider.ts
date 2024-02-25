import Plugin from '../Plugin';

export class Provider {
  constructor(
    protected plugin: Plugin,
    protected options,
  ) {}

  async send(receiver: string, data: { [key: string]: any }): Promise<any> {}
}
