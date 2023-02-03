export interface CollectionTemplateOptions {
  name: string;
  hooks: any;
}

export default class CollectionTemplate {
  options: CollectionTemplateOptions;

  hooks: any;
  constructor(options: CollectionTemplateOptions) {
    this.options = options;
    this.hooks = options.hooks;
  }
}
