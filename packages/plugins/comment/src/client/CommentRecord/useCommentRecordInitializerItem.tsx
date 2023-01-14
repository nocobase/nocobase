import { SchemaInitializerContext } from '@nocobase/client';
import { useContext } from 'react';
import { useCommentTranslation } from '../locale';

export const useCommentRecordInitializerItem = () => {
  const { t } = useCommentTranslation();
  const initializes = useContext(SchemaInitializerContext);
  const mediaItem = initializes.BlockInitializers.items.find((item) => item.key === 'media');
  const hasCommentRecordInitializer = mediaItem.children.some(
    (initialize) => initialize.component === 'CommentRecordInitializer',
  );
  !hasCommentRecordInitializer &&
    mediaItem.children.push({
      key: 'comment',
      type: 'item',
      title: t('Comment Record'),
      component: 'CommentRecordInitializer',
    });
};
