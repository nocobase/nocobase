import React, { FC, useRef, useEffect, Suspense } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { IPreviewerProps } from 'dumi';
import DefaultPreviewer from 'dumi/theme-default/builtins/Previewer';

const Previewer: FC<IPreviewerProps> = ({ children, ...props }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let root: Root
    if (ref.current) {
      root = createRoot(ref.current)
      root.render(<Suspense fallback={<div>loading...</div>}>{children}</Suspense>)
    }
    return () => {
      if (root) {
        root.unmount()
      }
    }
  }, []);
  return <DefaultPreviewer {...props}><div ref={ref} /></DefaultPreviewer>;
};

export default Previewer;
