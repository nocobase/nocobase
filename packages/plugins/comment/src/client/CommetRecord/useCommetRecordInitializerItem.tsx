import { SchemaInitializerContext } from '@nocobase/client';
import { useContext } from 'react';

export const useCommetRecordInitializerItem = () => {
  const initializes = useContext(SchemaInitializerContext);
  const mediaItem = initializes.BlockInitializers.items.find((item) => item.key === 'media');
  const hasCommetRecordInitializer = mediaItem.children.some(
    (initialize) => initialize.component === 'CommetRecordInitializer',
  );
  console.log(hasCommetRecordInitializer);
  !hasCommetRecordInitializer &&
    mediaItem.children.push({
      key: 'comment',
      type: 'item',
      title: '{{t("Commet Record")}}',
      component: 'CommetRecordInitializer',
    });
};
