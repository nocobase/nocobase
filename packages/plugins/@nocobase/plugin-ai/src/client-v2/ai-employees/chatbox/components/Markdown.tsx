/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Form as AntdForm,
  Input,
  Modal,
  Space,
  Spin,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import {
  CloseOutlined,
  CodeOutlined,
  CopyOutlined,
  EditOutlined,
  ExpandOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dark, defaultStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useGlobalTheme } from '@nocobase/client-v2';
import { useT } from '../../../locale';
import type { Message } from '../../types';
import { useChat } from '../hooks/useChat';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { Actions } from './Actions';

const downloadIconPath =
  'M505.7 661a8 8 0 0 0 12.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z';

export const Markdown: React.FC<{
  children: string;
  message?: Message['content'];
}> = ({ children, message }) => {
  const tagIndexes: Record<string, number> = {};
  const getIndex = (tagName: string): number => {
    if (!(tagName in tagIndexes)) {
      tagIndexes[tagName] = -1;
    }
    tagIndexes[tagName] += 1;
    return tagIndexes[tagName];
  };
  const components = {
    code: (props: CodeProps) => <Code {...props} message={message} />,
    form: (props: FormProps) => <FormRenderer {...props} message={message} />,
    echarts: (props: EchartsProps) => <Echarts {...props} index={getIndex('echarts')} message={message} />,
  } as unknown as Components;

  return (
    <div style={{ marginBottom: '-1em' }}>
      <ReactMarkdown
        components={components}
        rehypePlugins={[
          rehypeRaw,
          [
            rehypeSanitize,
            {
              ...defaultSchema,
              tagNames: [...(defaultSchema.tagNames ?? []), 'echarts', 'form', 'collections'],
              attributes: {
                ...defaultSchema.attributes,
                form: ['uid', 'datasource', 'collection'],
              },
            },
          ],
        ]}
        remarkPlugins={[remarkGfm]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

type CodeProps = React.ComponentProps<'code'> & {
  node?: unknown;
  message?: Message['content'];
};

const isSupportLanguage = (language: string) => ['js', 'javascript', 'sql'].includes(language?.toLowerCase());

const Code: React.FC<CodeProps> = ({ children, className, node, message: chatMessage, ...rest }) => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const { isDarkTheme } = useGlobalTheme();
  const t = useT();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const editorRefMap = chat.use.editorRef();
  const currentEditorRefUid = chat.use.currentEditorRefUid();
  const editorRef = currentEditorRefUid ? editorRefMap?.[currentEditorRefUid] : null;
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const value = String(children)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n$/, '');
  const [expanded, setExpanded] = useState(false);

  if (!match) {
    return (
      <Typography.Text code {...rest} className={className}>
        {children}
      </Typography.Text>
    );
  }

  const copy = () => {
    navigator.clipboard.writeText(value);
    message.success(t('Copied'));
  };
  const canApply = !!editorRef && isSupportLanguage(language);
  let isFullText = true;
  if (chatMessage?.type === 'text' && typeof chatMessage.content === 'string') {
    const pattern = new RegExp('```' + language + '[\\s\\S]*?```', 's');
    isFullText = pattern.test(chatMessage.content);
  }

  return (
    <>
      <Card
        type="inner"
        size="small"
        title={
          <Space style={{ marginInline: token.marginXS }} size="middle">
            <CodeOutlined />
            <span>{language}</span>
          </Space>
        }
        styles={{
          header: { padding: 0 },
          body: {
            width: '100%',
            padding: 0,
            fontSize: token.fontSizeSM,
          },
        }}
        extra={
          <>
            <Tooltip title={t('Copy')}>
              <Button variant="text" color="default" size="small" onClick={copy} icon={<CopyOutlined />} />
            </Tooltip>
            <Tooltip title={t('Expand')}>
              <Button
                variant="text"
                color="default"
                size="small"
                onClick={() => setExpanded(true)}
                icon={<ExpandOutlined />}
              />
            </Tooltip>
          </>
        }
        actions={
          canApply
            ? [
                <Button
                  key="accept"
                  type="link"
                  disabled={!isFullText}
                  onClick={(event) => {
                    event.stopPropagation();
                    editorRef?.write(value);
                    message.info(t('Applied'));
                  }}
                >
                  {t('Apply to editor')}
                </Button>,
              ]
            : []
        }
      >
        <SyntaxHighlighter PreTag="div" language={language} style={isDarkTheme ? dark : defaultStyle}>
          {value}
        </SyntaxHighlighter>
      </Card>
      {chatMessage ? <Actions message={chatMessage} responseType={language || 'code'} value={value} /> : null}
      <Modal
        open={expanded}
        onCancel={() => setExpanded(false)}
        footer={null}
        width="80%"
        title={
          <Space>
            <Button type="text" icon={<CloseOutlined />} onClick={() => setExpanded(false)} />
            <span>{language}</span>
          </Space>
        }
        closeIcon={null}
      >
        <SyntaxHighlighter PreTag="div" language={language} style={isDarkTheme ? dark : defaultStyle}>
          {value}
        </SyntaxHighlighter>
      </Modal>
    </>
  );
};

type FormProps = React.ComponentProps<'form'> & {
  node?: {
    properties?: {
      uid?: string;
      datasource?: string;
      collection?: string;
    };
  };
  message?: Message['content'];
};

const FormRenderer: React.FC<FormProps> = ({ children, message }) => {
  const t = useT();
  const { token } = theme.useToken();
  const [form] = AntdForm.useForm<Record<string, unknown>>();
  const [editable, setEditable] = useState(false);
  const valuesSource = React.Children.toArray(children).join('').replace(/\n$/, '');
  const parsed = useMemo(() => {
    try {
      const value = JSON.parse(valuesSource) as unknown;
      return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }, [valuesSource]);

  useEffect(() => {
    if (parsed) {
      form.setFieldsValue(parsed);
    }
  }, [form, parsed]);

  if (!parsed) {
    return (
      <Alert
        type="warning"
        message={
          <Space direction="vertical" style={{ width: '100%' }}>
            <span>
              {t('The current result is not a valid form object. Please ask the AI employee to regenerate it.')}
            </span>
            <SyntaxHighlighter PreTag="div" language="json" style={defaultStyle}>
              {valuesSource}
            </SyntaxHighlighter>
          </Space>
        }
        style={{ marginBottom: token.margin }}
      />
    );
  }

  return (
    <Card
      size="small"
      style={{ marginBottom: token.margin }}
      actions={[
        <Button
          key="edit"
          size="small"
          icon={editable ? <SaveOutlined /> : <EditOutlined />}
          onClick={() => setEditable(!editable)}
        >
          {editable ? t('Save') : t('Edit')}
        </Button>,
        editable ? (
          <Button
            key="cancel"
            size="small"
            icon={<CloseOutlined />}
            onClick={() => {
              form.setFieldsValue(parsed);
              setEditable(false);
            }}
          >
            {t('Cancel')}
          </Button>
        ) : null,
      ].filter(Boolean)}
    >
      <AntdForm form={form} layout="vertical" disabled={!editable}>
        {Object.entries(parsed).map(([key, value]) => (
          <AntdForm.Item key={key} label={key} name={key} initialValue={stringifyJson(value)}>
            <Input.TextArea autoSize={{ minRows: 1, maxRows: 6 }} />
          </AntdForm.Item>
        ))}
      </AntdForm>
      {message ? <Actions message={message} responseType="json" value={JSON.stringify(form.getFieldsValue())} /> : null}
    </Card>
  );
};

type EchartsProps = React.ComponentProps<'div'> & {
  index?: number;
  message?: Message['content'];
};

class EchartsErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback: (error: Error) => React.ReactNode;
    resetKey: string;
  },
  { error: Error | null; resetKey: string }
> {
  state: { error: Error | null; resetKey: string } = {
    error: null,
    resetKey: this.props.resetKey,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(
    props: {
      resetKey: string;
    },
    state: { error: Error | null; resetKey: string },
  ) {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

const Echarts: React.FC<EchartsProps> = React.memo(
  ({ children, message, ...rest }) => {
    const chartRef = useRef<ReactECharts>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { token } = theme.useToken();
    const { isDarkTheme } = useGlobalTheme();
    const t = useT();
    const currentConversation = useChatConversationsStore.use.currentConversation();
    const chat = useChat(currentConversation);
    const responseLoading = chat.use.responseLoading();
    const optionSource = React.Children.toArray(children).join('');
    let option: Record<string, unknown> = {};
    let optionValid = true;

    try {
      option = JSON.parse(optionSource) as Record<string, unknown>;
    } catch (error) {
      optionValid = false;
    }

    useEffect(() => {
      if (!optionValid) {
        return;
      }

      const resizeChart = () => {
        chartRef.current?.getEchartsInstance()?.resize();
      };
      const timeouts = [0, 100, 300].map((delay) => window.setTimeout(resizeChart, delay));
      const observer =
        typeof ResizeObserver !== 'undefined' && containerRef.current
          ? new ResizeObserver(() => {
              resizeChart();
            })
          : null;

      if (observer && containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
        observer?.disconnect();
      };
    }, [optionSource, optionValid]);

    if (responseLoading && !message?.messageId) {
      return <Spin size="small" tip={t('Generating')} />;
    }

    if (!optionValid) {
      return (
        <Card
          size="small"
          title={t('ECharts')}
          styles={{
            title: {
              fontSize: token.fontSize,
              fontWeight: 400,
            },
            body: {
              width: '100%',
              fontSize: token.fontSizeSM,
            },
          }}
        >
          <SyntaxHighlighter {...rest} PreTag="div" language="json" style={isDarkTheme ? dark : defaultStyle}>
            {optionSource.replace(/\n$/, '')}
          </SyntaxHighlighter>
        </Card>
      );
    }

    return (
      <EchartsErrorBoundary
        resetKey={optionSource}
        fallback={(error) =>
          responseLoading ? null : (
            <Alert showIcon type="error" message={t('Invalid chart options')} description={error.message} />
          )
        }
      >
        <div ref={containerRef}>
          <ReactECharts
            ref={chartRef}
            echarts={echarts}
            option={{
              ...option,
              toolbox: {
                show: true,
                feature: {
                  saveAsImage: {
                    title: t('Save as image'),
                    icon: `path://${downloadIconPath}`,
                    iconStyle: {
                      fontSize: token.fontSizeSM,
                      color: token.colorText,
                      borderWidth: 0,
                    },
                    emphasis: {
                      iconStyle: {
                        fontSize: token.fontSizeSM,
                        color: token.colorLinkHover,
                        borderWidth: 0,
                      },
                    },
                  },
                },
              },
            }}
            theme={isDarkTheme ? 'dark' : 'default'}
          />
        </div>
      </EchartsErrorBoundary>
    );
  },
  (previous, next) => {
    const previousChildren = React.Children.toArray(previous.children).join('');
    const nextChildren = React.Children.toArray(next.children).join('');
    return (
      previousChildren === nextChildren &&
      previous.message?.messageId === next.message?.messageId &&
      previous.index === next.index
    );
  },
);

Echarts.displayName = 'Echarts';

function stringifyJson(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
