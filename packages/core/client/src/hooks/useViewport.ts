import { useEffect, useRef } from 'react';

const getViewportMeta = () => {
  if (typeof document === 'undefined') {
    return;
  }

  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]') || document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1, user-scalable=0';
  return meta;
};

export function useViewport() {
  const metaRef = useRef(getViewportMeta());
  useEffect(() => {
    if (!metaRef.current) {
      return;
    }
    document.head.insertBefore(metaRef.current, document.head.firstChild);
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      metaRef.current.content = 'width=1920px, initial-scale=1';
    };
  }, []);
}
