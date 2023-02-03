export interface CollectionTemplateOptions {
  name: string;
  hooks: any;
}

export default class CollectionTemplate {
  options: CollectionTemplateOptions;

  constructor(options: CollectionTemplateOptions) {
    this.options = options;
  }
}
