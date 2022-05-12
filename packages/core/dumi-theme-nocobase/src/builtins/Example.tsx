import React, { useRef, useEffect, useState } from 'react';
import './Example.less';

export default (props: { route: any }) => {
  const elm = useRef<HTMLIFrameElement>();
  const [height, setHeight] = useState(0);

  useEffect(() => {
    setHeight(elm.current.contentWindow.document.documentElement.scrollHeight);
  }, [elm]);

  return (
    props.route.meta.examplePath && (
      <div className="__dumi-default-example-wrapper">
        <div className="__dumi-default-example-wrapper-toolbar">
          {props.route.meta.description || props.route.meta.title}
          <span>
            <button
              className="__dumi-default-icon"
              onClick={() => elm.current.contentWindow.location.reload()}
            />
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={props.route.meta.examplePath}
              className="__dumi-default-icon"
            />
          </span>
        </div>
        <iframe src={props.route.meta.examplePath} ref={elm} style={{ height }} title="dumi" />
      </div>
    )
  );
};
