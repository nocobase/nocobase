import { SchemaComponentOptions, SchemaInitializerContext } from '@nocobase/client';
import React, { useContext } from 'react';
import { Comment } from './Comment';
import { CommentBlockInitializer } from './CommentBlockInitializer';
import { useTranslation } from 'react-i18next';

export const CommentProvider = (props: any) => {
  const { t } = useTranslation('plugin-comment');
  const items = useContext(SchemaInitializerContext);
  const children = items.BlockInitializers.items[2].children;
  const title = t("comment")
  children.push({
    key: 'plugin-comment',
    type: 'item',
    title,
    component: 'CommentBlockInitializer',
  });
  return (
    <SchemaComponentOptions components={{ Comment, CommentBlockInitializer }}>
      {props.children}
    </SchemaComponentOptions>
  );
};
