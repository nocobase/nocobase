/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { default as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark, defaultStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Card, Modal, Row, Col, Alert } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useT } from '../../../locale';
import { SchemaComponent, useGlobalTheme, useToken } from '@nocobase/client';
import { Generating } from './Generating';
import { uid } from '@formily/shared';
import { createForm, onFieldValueChange } from '@formily/core';
import { useChatMessageActions } from '../hooks/useChatMessageActions';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useChatMessagesStore } from '../stores/chat-messages';
import { Message } from '../../types';

const download =
  'M505.7 661a8 8 0 0 0 12.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z';
const edit =
  'M257.7 752c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 0 0 0-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 0 0 9.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9zm67.4-174.4L687.8 215l73.3 73.3-362.7 362.6-88.9 15.7 15.6-89zM880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32z';

export function replaceTagBlockByIndex(
  input: string,
  tagName: string,
  indexToReplace: number,
  newInnerStr: string,
): string {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  let currentIndex = 0;
  return input.replace(regex, (match, inner) => {
    if (currentIndex === indexToReplace) {
      currentIndex++;
      return `<${tagName}>\n${newInnerStr}\n</${tagName}>`;
    }
    currentIndex++;
    return match;
  });
}

const EditModal: React.FC<{
  open: boolean;
  setOpen: (open: boolean) => void;
  message: Message['content'];
  index: number;
  optionStr: string;
}> = ({ open, setOpen, optionStr, message, index }) => {
  const t = useT();
  const { token } = useToken();
  const { isDarkTheme } = useGlobalTheme();

  // const { updateMessage } = useChatMessageActions();

  const currentConversation = useChatConversationsStore.use.currentConversation();

  let initialOption: any;
  try {
    initialOption = JSON.parse(optionStr);
  } catch (err) {
    initialOption = null;
  }
  const [option, setOption] = useState(initialOption);
  const chartRef = useRef<ReactECharts>(null);
  const iconStyle = {
    fontSize: token.fontSizeSM,
    color: token.colorText,
    borderWidth: 0,
  };
  const emphasisIconStyle = {
    ...iconStyle,
    color: token.colorLinkHover,
  };

  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          option: initialOption,
        },
        effects() {
          onFieldValueChange('option', (field) => {
            setOption(field.value);
          });
        },
      }),
    [optionStr],
  );

  return (
    <Modal
      open={open}
      onCancel={() => {
        setOpen(false);
        form.reset();
      }}
      onOk={async () => {
        const content = replaceTagBlockByIndex(message.content, 'echarts', index, JSON.stringify(option));
        // await updateMessage({
        //   sessionId: currentConversation,
        //   messageId: message.messageId,
        //   content: {
        //     type: 'text',
        //     content,
        //   },
        // });
      }}
      okText={t('Save')}
      width="80%"
      afterOpenChange={(open) => {
        if (open) {
          setTimeout(() => {
            chartRef.current?.getEchartsInstance().resize();
          }, 0);
        }
      }}
    >
      <Row
        gutter={8}
        style={{
          marginTop: '16px',
        }}
      >
        <Col span={8}>
          <SchemaComponent
            schema={{
              type: 'void',
              name: uid(),
              properties: {
                form: {
                  'x-component': 'FormV2',
                  'x-component-props': {
                    form,
                  },
                  properties: {
                    option: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input.JSON',
                      'x-component-props': {
                        json5: true,
                        autoSize: {
                          minRows: 30,
                          maxRows: 30,
                        },
                      },
                    },
                  },
                },
              },
            }}
          />
        </Col>
        <Col span={16}>
          {option ? (
            <Card size="small">
              <ReactECharts
                ref={chartRef}
                option={{
                  ...option,
                  toolbox: {
                    show: true,
                    feature: {
                      saveAsImage: {
                        title: t('Save as image'),
                        icon: `path://${download}`,
                        iconStyle,
                        emphasis: {
                          iconStyle: emphasisIconStyle,
                        },
                      },
                    },
                  },
                }}
                theme={!isDarkTheme ? 'light' : 'defaultDark'}
              />
            </Card>
          ) : (
            <Alert type="error" showIcon message={t('Invalid configuration')} />
          )}
        </Col>
      </Row>
    </Modal>
  );
};

export const Echarts = (props: any) => {
  const { children, className, message, index, ...rest } = props;
  const [openEditModal, setOpenEditModal] = useState(false);
  const t = useT();
  const { token } = useToken();
  const { isDarkTheme } = useGlobalTheme();

  const responseLoading = useChatMessagesStore.use.responseLoading();

  const iconStyle = {
    fontSize: token.fontSizeSM,
    color: token.colorText,
    borderWidth: 0,
  };
  const emphasisIconStyle = {
    ...iconStyle,
    color: token.colorLinkHover,
  };

  if (responseLoading && !message.messageId) {
    return <Generating />;
  }

  const optionStr = React.Children.toArray(children).join('');
  let option = {};
  try {
    option = JSON.parse(optionStr);
  } catch (err) {
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
        <SyntaxHighlighter {...rest} PreTag="div" language={'json'} style={isDarkTheme ? dark : defaultStyle}>
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </Card>
    );
  }
  return (
    <>
      <ReactECharts
        option={{
          ...option,
          toolbox: {
            show: true,
            feature: {
              myEditFeature: {
                show: true,
                title: t('Edit'),
                icon: `path://${edit}`,
                iconStyle,
                emphasis: {
                  iconStyle: emphasisIconStyle,
                },
                onclick: () => {
                  setOpenEditModal(true);
                },
              },
              saveAsImage: {
                title: t('Save as image'),
                icon: `path://${download}`,
                iconStyle,
                emphasis: {
                  iconStyle: emphasisIconStyle,
                },
              },
            },
          },
        }}
        theme={!isDarkTheme ? 'light' : 'defaultDark'}
      />
      <EditModal
        open={openEditModal}
        setOpen={setOpenEditModal}
        optionStr={optionStr}
        message={message}
        index={index}
      />
    </>
  );
};
