import React, { FC, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { IPreviewerProps } from 'dumi';
import DefaultPreviewer from 'dumi/theme-default/builtins/Previewer';

const Previewer: FC<IPreviewerProps> = ({ children, ...props }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      createRoot(ref.current).render(children);
    }
  }, []);
  return <DefaultPreviewer {...props}><div ref={ref} /></DefaultPreviewer>;
};

export default Previewer;
