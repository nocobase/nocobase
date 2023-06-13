import { useEffect, useRef } from 'react';

const getViewportMeta = () => {
  if (typeof document === 'undefined') {
    return;
  }

  if (document.querySelector('meta[name="viewport"]')) {
    return;
  }

  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1, user-scalable=0, shrink-to-fit=no';
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
      metaRef.current.remove();
    };
  }, []);
}
