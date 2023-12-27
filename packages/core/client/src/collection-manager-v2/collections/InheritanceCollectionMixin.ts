import { CollectionV2 } from '../../application';

export class InheritanceCollectionMixin extends CollectionV2 {
  getParents(): any {}

  getChildren(): any {}

  getInheritedFields(): any {}

  getCurrentFields(): any {}

  getParentCollectionFields(): any {}

  getAllCollectionsInheritChain(): any {}

  getInheritCollectionsChain(): any {}

  getInheritCollections(): any {}
}
