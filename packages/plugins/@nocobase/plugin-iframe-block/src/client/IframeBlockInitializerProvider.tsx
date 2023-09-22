import { SchemaInitializerContext } from '@nocobase/client';
import { useContext } from 'react';

export const IframeBlockInitializerProvider = (props: any) => {
  const initializes = useContext<any>(SchemaInitializerContext);
  const mediaItem = initializes.BlockInitializers.items.find((item) => item.key === 'media');
  const hasIframeBlockInitializer = mediaItem.children.some(
    (initialize) => initialize.component === 'IframeBlockInitializer',
  );
  !hasIframeBlockInitializer &&
    mediaItem.children.push({
      key: 'iframe',
      type: 'item',
      title: '{{t("Iframe")}}',
      component: 'IframeBlockInitializer',
    });
  return props.children;
};
