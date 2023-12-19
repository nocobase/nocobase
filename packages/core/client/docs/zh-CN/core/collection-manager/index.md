# CollectionManager

```ts
class CollectionManager {
  addFieldInterfaces(interfaces) {}
  addCollectionTemplates(templates) {}
  addCollections(ns, collections) {}
  getCollection() {}
}

cm.setDefaultNamespace('default');

cm.addFieldInterfaces({
  select: {},
});

cm.addCollectionTemplates({
  calendar: {},
});

cm.getCollection();


const cm = new CollectionManager();
```
