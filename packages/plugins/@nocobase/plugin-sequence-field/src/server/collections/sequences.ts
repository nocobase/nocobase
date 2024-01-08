import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: {
    group: 'required',
    async delayRestore(restorer) {
      const app = restorer.app;
      const importedCollections = restorer.importedCollections;

      const sequenceFields = importedCollections
        .map((collection) => {
          const collectionInstance = app.db.getCollection(collection);
          if (!collectionInstance) throw new Error(`Collection ${collection} not found`);
          return [...collectionInstance.fields.values()].filter((field) => field.type === 'sequence');
        })
        .flat()
        .filter(Boolean);

      // a single sequence field refers to a single row in sequences table
      const sequencesAttributes = sequenceFields
        .map((field) => {
          const patterns = field.get('patterns');

          return patterns.map((pattern) => {
            return {
              collection: field.collection.name,
              field: field.name,
              key: pattern.options.key,
            };
          });
        })
        .flat()
        .filter((attr) => attr.collection && attr.field && attr.key);

      if (sequencesAttributes.length > 0) {
        await app.db.getRepository('sequences').destroy({
          filter: {
            $or: sequencesAttributes,
          },
        });
      }

      await restorer.importCollection({
        name: 'sequences',
        clear: false,
        rowCondition(row) {
          return sequencesAttributes.some((attributes) => {
            return (
              row.collection === attributes.collection && row.field === attributes.field && row.key === attributes.key
            );
          });
        },
      });
    },
  },
  name: 'sequences',
  shared: true,
  fields: [
    {
      name: 'collection',
      type: 'string',
    },
    {
      name: 'field',
      type: 'string',
    },
    {
      name: 'key',
      type: 'integer',
    },
    {
      name: 'current',
      type: 'bigInt',
    },
    {
      name: 'lastGeneratedAt',
      type: 'date',
    },
  ],
});
