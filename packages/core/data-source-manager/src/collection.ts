import { CollectionOptions, ICollection, ICollectionManager, IRepository } from './types';

export class Collection implements ICollection {
  repository: IRepository;

  constructor(
    protected options: CollectionOptions,
    protected collectionManager: ICollectionManager,
  ) {
    this.setRepository(options.repository);
  }

  protected setRepository(repository: any) {
    this.repository = this.collectionManager.getRegisteredRepository(repository || 'Repository');
  }
}
