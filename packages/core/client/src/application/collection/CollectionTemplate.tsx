import { ICollectionTemplate } from '../../collection-manager';

export class CollectionTemplate {
  public template: ICollectionTemplate;
  constructor(template: ICollectionTemplate) {
    this.template = template;
  }

  get name() {
    return this.template.name;
  }
}
