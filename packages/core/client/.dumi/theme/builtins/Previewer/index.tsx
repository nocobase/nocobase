import { FC, useRef, useEffect, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { IPreviewerProps } from 'dumi';
import DefaultPreviewer from 'dumi/theme-default/builtins/Previewer';

const Previewer: FC<IPreviewerProps> = ({ children, ...props }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ReactDOM.render(<Suspense fallback={<div>loading...</div>}>{children}</Suspense>, ref.current)
    }
    return () => {
      if (ref.current) {
        ReactDOM.unmountComponentAtNode(ref.current)
      }
    }
  }, []);
  return <DefaultPreviewer {...props}><div ref={ref} /></DefaultPreviewer>;
};

export default Previewer;
