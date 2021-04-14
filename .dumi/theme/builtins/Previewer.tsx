import React, { useState, useContext, useRef, useEffect } from 'react';
import Tabs, { TabPane } from 'rc-tabs';
// @ts-ignore
import { history } from 'dumi';
import type { IPreviewerComponentProps} from 'dumi/theme';
import {
  context,
  useCodeSandbox,
  useRiddle,
  useMotions,
  useCopy,
  useLocaleProps,
  useDemoUrl,
  useTSPlaygroundUrl,
  Link,
  AnchorLink,
  usePrefersColor
} from 'dumi/theme';
import type { ICodeBlockProps } from './SourceCode';
import SourceCode from './SourceCode';
import './Previewer.less';

export interface IPreviewerProps extends IPreviewerComponentProps {
  /**
   * enable transform to change CSS containing block for demo
   */
  transform?: boolean;
  /**
   * modify background for demo area
   */
  background?: string;
  /**
   * collapse padding of demo area
   */
  compact?: boolean;
  /**
   * configurations for action button
   */
  hideActions?: ('CSB' | 'EXTERNAL' | 'RIDDLE')[];
  /**
   * show source code by default
   */
  defaultShowCode?: boolean;
  /**
   * use iframe mode for this demo
   */
  iframe?: true | number;
  /**
   * replace builtin demo url
   */
  demoUrl?: string;
}

/**
 * get source code type for file
 * @param file    file path
 * @param source  file source object
 */
function getSourceType(file: string, source: IPreviewerComponentProps['sources']['_']) {
  // use file extension as source type first
  let type = file.match(/\.(\w+)$/)?.[1];

  if (!type) {
    type = source.tsx ? 'tsx' : 'jsx';
  }

  return type as ICodeBlockProps['lang'];
}

const Previewer: React.FC<IPreviewerProps> = oProps => {
  const demoRef = useRef();
  const { locale } = useContext(context);
  const props = useLocaleProps<IPreviewerProps>(locale, oProps);
  const builtinDemoUrl = useDemoUrl(props.identifier);
  const demoUrl = props.demoUrl || builtinDemoUrl;
  const isActive = history?.location.hash === `#${props.identifier}`;
  const isSingleFile = Object.keys(props.sources).length === 1;
  const openCSB = useCodeSandbox(props.hideActions?.includes('CSB') ? null : props);
  const openRiddle = useRiddle(props.hideActions?.includes('RIDDLE') ? null : props);
  const [execMotions, isMotionRunning] = useMotions(props.motions || [], demoRef.current);
  const [copyCode, copyStatus] = useCopy();
  const [currentFile, setCurrentFile] = useState('_');
  const [sourceType, setSourceType] = useState(
    getSourceType(currentFile, props.sources[currentFile]),
  );
  const [showSource, setShowSource] = useState(Boolean(props.defaultShowCode));
  const [iframeKey, setIframeKey] = useState(Math.random());
  const currentFileCode =
    props.sources[currentFile][sourceType] || props.sources[currentFile].content;
  const playgroundUrl = useTSPlaygroundUrl(locale, currentFileCode);
  const iframeRef = useRef<HTMLIFrameElement>();
  const [color] = usePrefersColor();

  // re-render iframe if prefers color changed
  useEffect(() => {
    setIframeKey(Math.random());
  }, [color]);

  function handleFileChange(filename: string) {
    setCurrentFile(filename);
    setSourceType(getSourceType(filename, props.sources[filename]));
  }

  return (
    <div
      style={props.style}
      className={[
        props.className,
        '__dumi-default-previewer',
        isActive ? '__dumi-default-previewer-target' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      id={props.identifier}
      data-debug={props.debug || undefined}
      data-iframe={props.iframe || undefined}
    >
      {props.iframe && <div className="__dumi-default-previewer-browser-nav" />}
      <div
        ref={demoRef}
        className="__dumi-default-previewer-demo"
        style={{
          transform: props.transform ? 'translate(0, 0)' : undefined,
          padding: props.compact || (props.iframe && props.compact !== false) ? '0' : undefined,
          background: props.background,
        }}
      >
        {props.iframe ? (
          <iframe
            title="dumi-previewer"
            style={{
              // both compatible with unit or non-unit, such as 100, 100px, 100vh
              height: String(props.iframe).replace(/(\d)$/, '$1px'),
            }}
            key={iframeKey}
            src={demoUrl}
            ref={iframeRef}
          />
        ) : (
          props.children
        )}
      </div>
      <div className="__dumi-default-previewer-desc" data-title={props.title}>
        {props.title && <AnchorLink to={`#${props.identifier}`}>{props.title}</AnchorLink>}
        {props.description && (
          <div
            // eslint-disable-next-line
            dangerouslySetInnerHTML={{ __html: props.description }}
          />
        )}
      </div>
      <div className="__dumi-default-previewer-actions">
        {openCSB && (
          <button
            title="Open demo on CodeSandbox.io"
            className="__dumi-default-icon"
            role="codesandbox"
            onClick={openCSB}
          />
        )}
        {openRiddle && (
          <button
            title="Open demo on Riddle"
            className="__dumi-default-icon"
            role="riddle"
            onClick={openRiddle}
          />
        )}
        {props.motions && (
          <button
            title="Execute motions"
            className="__dumi-default-icon"
            role="motions"
            disabled={isMotionRunning}
            onClick={() => execMotions()}
          />
        )}
        {props.iframe && (
          <button
            title="Reload demo iframe page"
            className="__dumi-default-icon"
            role="refresh"
            onClick={() => setIframeKey(Math.random())}
          />
        )}
        {!props.hideActions?.includes('EXTERNAL') && (
          <Link target="_blank" to={demoUrl}>
            <button
              title="Open demo in new tab"
              className="__dumi-default-icon"
              role="open-demo"
              type="button"
            />
          </Link>
        )}
        <span />
        <button
          title="Copy source code"
          className="__dumi-default-icon"
          role="copy"
          data-status={copyStatus}
          onClick={() => copyCode(currentFileCode)}
        />
        {sourceType === 'tsx' && showSource && (
          <Link target="_blank" to={playgroundUrl}>
            <button
              title="Get JSX via TypeScript Playground"
              className="__dumi-default-icon"
              role="change-tsx"
              type="button"
            />
          </Link>
        )}
        <button
          title="Toggle source code panel"
          className={`__dumi-default-icon${showSource ? ' __dumi-default-btn-expand' : ''}`}
          role="source"
          type="button"
          onClick={() => setShowSource(!showSource)}
        />
      </div>
      {showSource && (
        <div className="__dumi-default-previewer-source-wrapper">
          {!isSingleFile && (
            <Tabs
              className="__dumi-default-previewer-source-tab"
              prefixCls="__dumi-default-tabs"
              moreIcon="···"
              defaultActiveKey={currentFile}
              onChange={handleFileChange}
            >
              {Object.keys(props.sources).map(filename => (
                <TabPane
                  tab={
                    filename === '_'
                      ? `index.${getSourceType(filename, props.sources[filename])}`
                      : filename
                  }
                  key={filename}
                />
              ))}
            </Tabs>
          )}
          <div className="__dumi-default-previewer-source">
            <SourceCode code={currentFileCode} lang={sourceType} showCopy={false} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Previewer;
