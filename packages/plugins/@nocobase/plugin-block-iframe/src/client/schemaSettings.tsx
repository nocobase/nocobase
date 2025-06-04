/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LinkOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  SchemaSettings,
  SchemaSettingsBlockHeightItem,
  Variable,
  useAPIClient,
  useDesignable,
  useFormBlockContext,
  useRecord,
  useURLAndHTMLSchema,
  useVariableOptions,
  SchemaSettingsLinkageRules,
  LinkageRuleCategory,
  FlagProvider,
} from '@nocobase/client';
import { Select, Tooltip } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

const IframeProvider = (props) => {
  return <FlagProvider collectionField={true}>{props.children}</FlagProvider>;
};
const getVariableComponentWithScope = (Com) => {
  return (props) => {
    const fieldSchema = useFieldSchema();
    const { form } = useFormBlockContext();
    const record = useRecord();
    const scope = useVariableOptions({
      collectionField: { uiSchema: fieldSchema },
      form,
      record,
      uiSchema: fieldSchema,
      noDisabled: true,
    });
    return <Com {...props} scope={scope} />;
  };
};

const AllowOptionsHelp = ({ type }) => {
  const { t, i18n } = useTranslation();
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
      {type}{' '}
      <Tooltip
        zIndex={9999}
        title={
          <span>
            {description}{' '}
            <a
              href={`https://developer.mozilla.org/${
                i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US'
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

const AllowDescription = () => {
  const { t, i18n } = useTranslation();
  const helpURL =
    i18n.language === 'zh-CN'
      ? 'https://developer.mozilla.org/zh-CN/docs/Web/HTML/Reference/Elements/iframe#allow'
      : 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#allow';
  return (
    <span>
      {t(
        'Specifies a Permissions Policy for the <iframe>. The policy defines what features are available to the <iframe> (for example, access to the microphone, camera, battery, web-share, etc.) based on the origin of the request.',
      )}{' '}
      <a href={helpURL} target="_blank" rel="noreferrer">
        <LinkOutlined />
      </a>
    </span>
  );
};

const commonOptions: any = {
  items: [
    {
      name: 'EditIframe',
      type: 'modal',
      useComponentProps() {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { t, i18n } = useTranslation();
        const { dn } = useDesignable();
        const api = useAPIClient();
        const { mode, url, params, htmlId, height = '60vh', engine, allow } = fieldSchema['x-component-props'] || {};
        const saveHtml = async (html: string) => {
          const options = {
            values: { html },
          };
          if (htmlId) {
            // eslint-disable-next-line no-unsafe-optional-chaining
            const { data } = await api.resource('iframeHtml').update?.({ ...options, filterByTk: htmlId });
            return data?.data?.[0] || { id: htmlId };
          } else {
            // eslint-disable-next-line no-unsafe-optional-chaining
            const { data } = await api.resource('iframeHtml').create?.(options);
            return data?.data;
          }
        };
        const { urlSchema, paramsSchema } = useURLAndHTMLSchema();
        const submitHandler = async ({ mode, url, html, height, params, engine, allow }) => {
          const componentProps = fieldSchema['x-component-props'] || {};
          componentProps['mode'] = mode;
          componentProps['height'] = height;
          componentProps['engine'] = engine || 'string';
          componentProps['params'] = params;
          componentProps['url'] = url;
          componentProps['allow'] = allow;
          if (mode === 'html') {
            const data = await saveHtml(html);
            componentProps['htmlId'] = data.id;
          }
          fieldSchema['x-component-props'] = componentProps;
          field.componentProps = { ...componentProps };
          field.data = { v: uid() };
          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              'x-component-props': componentProps,
            },
          });
        };
        // 外部定义 description 的内容
        const descriptionContent = (
          <>
            <span style={{ marginLeft: '.25em' }} className={'ant-formily-item-extra'}>
              {t('Syntax references')}:
            </span>{' '}
            <a
              href={`https://${
                i18n.language === 'zh-CN' ? 'docs-cn' : 'docs'
              }.nocobase.com/handbook/template-handlebars`}
              target="_blank"
              rel="noreferrer"
            >
              Handlebars.js
            </a>
          </>
        );

        return {
          title: t('Edit iframe'),
          asyncGetInitialValues: async () => {
            const values = {
              mode,
              url,
              height,
              engine,
              params,
              allow,
            };
            if (htmlId) {
              // eslint-disable-next-line no-unsafe-optional-chaining
              const { data } = await api.resource('iframeHtml').get?.({ filterByTk: htmlId });
              values['html'] = data?.data?.html || '';
            }
            return values;
          },
          schema: {
            type: 'object',
            title: t('Edit iframe'),
            properties: {
              container: {
                type: 'void',
                'x-component': IframeProvider,
                properties: {
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
                    ...urlSchema,
                    required: true,
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
                  params: paramsSchema,
                  engine: {
                    title: '{{t("Template engine")}}',
                    'x-component': 'Radio.Group',
                    'x-decorator': 'FormItem',
                    default: 'string',
                    enum: [
                      { value: 'string', label: t('String template') },
                      { value: 'handlebars', label: t('Handlebars') },
                    ],
                    'x-reactions': {
                      dependencies: ['mode'],
                      fulfill: {
                        state: {
                          hidden: '{{$deps[0] === "url"}}',
                        },
                      },
                    },
                  },
                  html: {
                    title: t('html'),
                    type: 'string',
                    'x-decorator': 'FormItem',
                    'x-component': getVariableComponentWithScope(Variable.RawTextArea),
                    'x-component-props': {
                      rows: 10,
                    },
                    required: true,
                    description: descriptionContent,
                    'x-reactions': [
                      {
                        dependencies: ['mode'],
                        fulfill: {
                          state: {
                            hidden: '{{$deps[0] === "url"}}',
                          },
                        },
                      },
                      (field) => {
                        const { engine } = field.form.values;
                        if (engine === 'handlebars') {
                          field.description = descriptionContent;
                        } else {
                          field.description = null;
                        }
                      },
                    ],
                  },
                },
              },
            },
          } as ISchema,
          onSubmit: submitHandler,
          noRecord: true,
          width: 600,
        };
      },
    },
    {
      name: 'setTheBlockHeight',
      Component: SchemaSettingsBlockHeightItem,
    },
    {
      name: 'blockLinkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { t } = useTranslation();
        return {
          title: t('Block Linkage rules'),
          category: LinkageRuleCategory.block,
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      useComponentProps() {
        return {
          removeParentsIfNoChildren: true,
          breakRemoveOn: {
            'x-component': 'Grid',
          },
        };
      },
    },
  ],
};

/**
 * @deprecated
 */
export const iframeBlockSchemaSettings_deprecated = new SchemaSettings({
  name: 'iframeBlockSchemaSettings',
  ...commonOptions,
});

export const iframeBlockSchemaSettings = new SchemaSettings({
  name: 'blockSettings:iframe',
  ...commonOptions,
});
