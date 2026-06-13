/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContextSelector, observer, useFlowContext } from '@nocobase/flow-engine';
import { css } from '@emotion/css';
import { Card, Select, Spin, Tooltip } from 'antd';
import { LinkOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import RIframe from 'react-iframe';
import type { IIframe } from 'react-iframe/types';
import React, { useCallback, useEffect, useState } from 'react';
import { BlockModel, CodeEditor, joinUrlSearch, TextAreaWithContextSelector } from '@nocobase/client-v2';
import { tExpr, useT } from '../locale';

const iframeBlockCardClass = css`
  & > .ant-card-body {
    padding: 0 !important;
  }
`;

const HtmlEditorBase: React.FC<any> = (props) => {
  const { value, onChange } = props;
  const ctx = useFlowContext();
  return (
    <CodeEditor
      {...props}
      language="html"
      value={value}
      onChange={onChange}
      showLogs={false}
      RightExtra={({ viewRef }) => (
        <FlowContextSelector
          onChange={(text) => {
            if (!text) return;
            const view = viewRef.current;
            if (!view) return;
            const { from, to } = view.state.selection.main;
            const newPos = from + text.length;
            view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: newPos }, scrollIntoView: true });
            view.focus();
          }}
          metaTree={() => ctx.getPropertyMetaTree()}
        />
      )}
    />
  );
};

const Iframe: any = observer(
  (props: IIframe & { html?: string; htmlId?: number; mode: string; params?: any; heightMode?: string }) => {
    const { url, htmlId, mode = 'url', html, params, heightMode, ...others } = props;
    const ctx = useFlowContext();
    const [loading, setLoading] = useState(false);
    const [htmlContent, setHtmlContent] = useState<string>();
    const [src, setSrc] = useState(null);
    const isFixedHeight = heightMode === 'specifyValue' || heightMode === 'fullHeight';
    const iframeHeight = !heightMode || heightMode === 'defaultHeight' ? '60vh' : '100%';
    const renderTemplate = useCallback(
      async (value: any) => {
        if (typeof value !== 'string') return value;
        const result = await ctx.liquid.renderWithFullContext(value, ctx);
        return typeof ctx.compile === 'function' ? ctx.compile(result) : result;
      },
      [ctx],
    );

    useEffect(() => {
      if (mode !== 'html' || !htmlId) {
        setHtmlContent(undefined);
        return;
      }

      let active = true;
      const loadHtml = async () => {
        setLoading(true);
        try {
          const res = await ctx.api.resource('iframeHtml').get({ filterByTk: htmlId });
          if (!active) return;
          setHtmlContent(res?.data?.data?.html || res?.data?.html || '');
        } catch (error) {
          console.error(error);
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

      void loadHtml();

      return () => {
        active = false;
      };
    }, [ctx.api, html, htmlId, mode]);

    useEffect(() => {
      let active = true; // 标记当前请求是否有效

      const generateSrc = async (content: string | undefined) => {
        if (mode === 'html') {
          if (!content) return;
          try {
            const targetHtmlContent = await renderTemplate(content);
            if (targetHtmlContent === undefined) return;

            const encodedHtml = encodeURIComponent(targetHtmlContent);
            const dataUrl = 'data:text/html;charset=utf-8,' + encodedHtml;

            if (active) {
              setSrc(dataUrl);
            }
          } catch (err) {
            console.error(err);
          }
        } else {
          try {
            const targetUrl = await renderTemplate(url);
            const targetParams = await Promise.all(
              (params || []).map(async (param) => ({
                ...param,
                name: await renderTemplate(param.name),
                value: await renderTemplate(param.value),
              })),
            );
            const parsedUrl = joinUrlSearch(targetUrl, targetParams);
            if (active) setSrc(parsedUrl);
          } catch (error) {
            console.error('Error fetching target URL:', error);
            if (active) setSrc('fallback-url');
          }
        }
      };

      generateSrc(htmlContent);

      // cleanup: 标记旧调用无效
      return () => {
        active = false;
      };
    }, [ctx, htmlContent, mode, url, params, html, htmlId, renderTemplate]);
    if (loading && !src) {
      return (
        <div
          style={{
            height: isFixedHeight ? '100%' : iframeHeight,
            flex: isFixedHeight ? 1 : undefined,
            minHeight: isFixedHeight ? 0 : undefined,
            border: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spin />
        </div>
      );
    }

    return (
      <RIframe
        url={src}
        width="100%"
        display="block"
        position="relative"
        styles={{
          height: iframeHeight,
          border: 0,
          flex: isFixedHeight ? 1 : undefined,
          minHeight: isFixedHeight ? 0 : undefined,
        }}
        {...others}
      />
    );
  },
  { displayName: 'Iframe' },
);

export class IframeBlockModel extends BlockModel {
  onInit(options: any): void {
    super.onInit(options);
    this.setDecoratorProps({
      className: [this.decoratorProps.className, iframeBlockCardClass].filter(Boolean).join(' '),
    });
  }

  renderComponent() {
    const { url, htmlId, mode = 'url' } = this.props;
    const { heightMode } = this.decoratorProps;
    const t = this.context.t;
    if ((mode === 'url' && !url) || (mode === 'html' && !htmlId)) {
      return <Card>{t('Please fill in the iframe URL')}</Card>;
    }
    return <Iframe {...this.props} heightMode={heightMode} />;
  }
}
const AllowDescription = () => {
  const t = useT();
  const ctx = useFlowContext();
  const helpURL = ctx.locale?.startsWith('zh')
    ? 'https://developer.mozilla.org/zh-CN/docs/Web/HTML/Reference/Elements/iframe#allow'
    : 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#allow';
  return (
    <span>
      {t(
        'Specifies a Permissions Policy for the <iframe>. The policy defines what features are available to the <iframe> (for example, access to the microphone, camera, battery, web-share, etc.) based on the origin of the request.',
      )}
      <a href={helpURL} target="_blank" rel="noreferrer">
        <LinkOutlined />
      </a>
    </span>
  );
};

const AllowOptionsHelp = ({ type }) => {
  const t = useT();
  const ctx = useFlowContext();
  const typeToDescription = {
    autoplay: t(
      'Controls whether the current document is allowed to autoplay media requested through the HTMLMediaElement interface. When this policy is disabled and there were no user gestures, the Promise returned by HTMLMediaElement.play() will reject with a NotAllowedError DOMException. The autoplay attribute on <audio> and <video> elements will be ignored.',
    ),
    camera: t(
      'Controls whether the current document is allowed to use video input devices. When this policy is disabled, the Promise returned by getUserMedia() will reject with a NotAllowedError DOMException.',
    ),
    'document-domain': t(
      'Controls whether the current document is allowed to set document.domain. When this policy is disabled, attempting to set document.domain will fail and cause a SecurityError DOMException to be thrown.',
    ),
    'encrypted-media': t(
      'Controls whether the current document is allowed to use the Encrypted Media Extensions API (EME). When this policy is disabled, the Promise returned by Navigator.requestMediaKeySystemAccess() will reject with a SecurityError DOMException.',
    ),
    fullscreen: t(
      'Controls whether the current document is allowed to use Element.requestFullscreen(). When this policy is disabled, the returned Promise rejects with a TypeError.',
    ),
    geolocation: t(
      'Controls whether the current document is allowed to use the Geolocation Interface. When this policy is disabled, calls to getCurrentPosition() and watchPosition() will cause those functions callbacks to be invoked with a GeolocationPositionError code of PERMISSION_DENIED.',
    ),
    microphone: t(
      'Controls whether the current document is allowed to use audio input devices. When this policy is disabled, the Promise returned by MediaDevices.getUserMedia() will reject with a NotAllowedError DOMException.',
    ),
    midi: t(
      'Controls whether the current document is allowed to use the Web MIDI API. When this policy is disabled, the Promise returned by Navigator.requestMIDIAccess() will reject with a SecurityError DOMException.',
    ),
    payment: t(
      'Controls whether the current document is allowed to use the Payment Request API. When this policy is enabled, the PaymentRequest() constructor will throw a SecurityError DOMException.',
    ),
  };

  const description = typeToDescription[type];

  return (
    <span>
      {type}
      <Tooltip
        zIndex={9999}
        title={
          <span>
            {description}
            <a
              href={`https://developer.mozilla.org/${
                ctx.locale?.startsWith('zh') ? 'zh-CN' : 'en-US'
              }/docs/Web/HTTP/Reference/Headers/Permissions-Policy/${type}`}
              target="_blank"
              rel="noreferrer"
            >
              <LinkOutlined />
            </a>
          </span>
        }
      >
        <QuestionCircleOutlined />
      </Tooltip>
    </span>
  );
};

IframeBlockModel.registerFlow({
  key: 'iframeBlockSettings',
  title: tExpr('Iframe block setting'),
  on: 'beforeRender',
  steps: {
    editIframe: {
      title: tExpr('Edit iframe'),
      uiSchema(ctx) {
        const t = ctx.t;
        return {
          mode: {
            title: '{{t("Mode")}}',
            'x-component': 'Radio.Group',
            'x-decorator': 'FormItem',
            required: true,
            default: 'url',
            enum: [
              { value: 'url', label: t('URL') },
              { value: 'html', label: t('HTML') },
            ],
          },
          url: {
            title: t('URL'),
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': TextAreaWithContextSelector,
            'x-component-props': {
              placeholder: t('https://www.example.com'),
            },
            description: t('Do not concatenate search params in the URL'),
            required: true,
            'x-reactions': {
              dependencies: ['mode'],
              fulfill: {
                state: {
                  hidden: '{{$deps[0] === "html"}}',
                },
              },
            },
          },
          allow: {
            title: 'Allow',
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': (props) => {
              return (
                <Select
                  {...props}
                  allowClear
                  options={[
                    { value: 'autoplay', label: <AllowOptionsHelp type="autoplay" /> },
                    { value: 'camera', label: <AllowOptionsHelp type="camera" /> },
                    { value: 'document-domain', label: <AllowOptionsHelp type="document-domain" /> },
                    { value: 'encrypted-media', label: <AllowOptionsHelp type="encrypted-media" /> },
                    { value: 'fullscreen', label: <AllowOptionsHelp type="fullscreen" /> },
                    { value: 'geolocation', label: <AllowOptionsHelp type="geolocation" /> },
                    { value: 'microphone', label: <AllowOptionsHelp type="microphone" /> },
                    { value: 'midi', label: <AllowOptionsHelp type="midi" /> },
                    { value: 'payment', label: <AllowOptionsHelp type="payment" /> },
                  ]}
                />
              );
            },
            description: <AllowDescription />,
          },
          params: {
            type: 'array',
            'x-component': 'ArrayItems',
            'x-decorator': 'FormItem',
            title: tExpr('Search parameters'),
            items: {
              type: 'object',
              properties: {
                space: {
                  type: 'void',
                  'x-component': 'Space',
                  'x-component-props': {
                    style: {
                      flexWrap: 'nowrap',
                      maxWidth: '100%',
                      width: '100%',
                    },
                    className: css`
                      & > .ant-space-item:first-child,
                      & > .ant-space-item:last-child {
                        flex-shrink: 0;
                      }
                      & > .ant-space-item:nth-child(2) {
                        width: 100%;
                      }
                    `,
                  },
                  properties: {
                    name: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-component-props': {
                        placeholder: tExpr('Name'),
                      },
                    },
                    value: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': TextAreaWithContextSelector,
                      'x-component-props': {
                        placeholder: `{{t("Value")}}`,
                        useTypedConstant: true,
                        changeOnSelect: true,
                        rows: 1,
                        style: {
                          width: '100%',
                        },
                      },
                    },
                    remove: {
                      type: 'void',
                      'x-decorator': 'FormItem',
                      'x-component': 'ArrayItems.Remove',
                    },
                  },
                },
              },
            },
            'x-reactions': {
              dependencies: ['mode'],
              fulfill: {
                state: {
                  hidden: '{{$deps[0] === "html"}}',
                },
              },
            },
            properties: {
              add: {
                type: 'void',
                title: tExpr('Add parameter'),
                'x-component': 'ArrayItems.Addition',
              },
            },
          },
          html: {
            title: t('html'),
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': HtmlEditorBase,
            'x-component-props': {
              minHeight: '320px',
              theme: 'light',
              enableLinter: true,
            },
            'x-reactions': {
              dependencies: ['mode'],
              fulfill: {
                state: {
                  hidden: '{{$deps[0] === "url"}}',
                },
              },
            },
            required: true,
          },
        };
      },
      useRawParams: true,
      async beforeParamsSave(ctx, params) {
        const { mode, html, htmlId } = params;
        const saveHtml = async (html: string) => {
          const options = {
            values: { html },
          };
          if (htmlId) {
            // eslint-disable-next-line no-unsafe-optional-chaining
            const { data } = await ctx.api.resource('iframeHtml').update?.({ ...options, filterByTk: htmlId });
            return data?.data?.[0] || { id: htmlId };
          } else {
            // eslint-disable-next-line no-unsafe-optional-chaining
            const { data } = await ctx.api.resource('iframeHtml').create?.(options);
            return data;
          }
        };
        if (mode === 'html') {
          const data = await saveHtml(html);
          ctx.model.setStepParams('iframeBlockSettings', 'editIframe', { htmlId: data.data?.id || data?.id });
        }
      },
      async handler(ctx, params) {
        const { mode, url, html, params: searchParams, allow, htmlId } = params;
        ctx.model.setProps({
          mode,
          url,
          html,
          params: searchParams,
          allow,
          htmlId,
        });
      },
    },
  },
});

IframeBlockModel.define({
  label: tExpr('Iframe'),
});
