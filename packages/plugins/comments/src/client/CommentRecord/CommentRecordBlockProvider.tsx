import {
  CollectionManagerProvider,
  SchemaInitializerContext,
  SchemaInitializerProvider,
  TableBlockProvider,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { useCollectionsCollection, useCommentsCollection } from './collections';
import { CommentRecordTableActionColumnInitializers } from './initializers/CommentRecordTableActionColumnInitializers';
import { CommentRecordTableActionInitializers } from './initializers/CommentRecordTableActionInitializers';
import { CommentRecordTableColumnInitializers } from './initializers/CommentRecordTableColumnInitializers';

export const CommentRecordBlockProvider: React.FC = ({ children, ...restProps }) => {
  const initializers = useContext(SchemaInitializerContext);
  const commentsCollection = useCommentsCollection();
  const collectionsCollection = useCollectionsCollection();

  return (
    <SchemaInitializerProvider
      initializers={{
        ...initializers,
        CommentRecordTableActionInitializers: CommentRecordTableActionInitializers,
        CommentRecordTableActionColumnInitializers: CommentRecordTableActionColumnInitializers,
        CommentRecordTableColumnInitializers: CommentRecordTableColumnInitializers,
      }}
    >
      <CollectionManagerProvider collections={[commentsCollection, collectionsCollection]}>
        <TableBlockProvider {...restProps}>{children}</TableBlockProvider>
      </CollectionManagerProvider>
    </SchemaInitializerProvider>
  );
};
