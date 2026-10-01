/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings, useDesignable, useColumnSchema } from '@nocobase/client';
import { useFieldSchema, useField, ISchema } from '@formily/react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import React from 'react';
import { useT } from '../locale';

type ModalSettingItemType = {
  type: 'modal';
  name: string;
  useComponentProps: () => {
    title: string;
    schema: ISchema;
    onSubmit: (values: any) => void;
  };
};

type SwitchSettingItemType = {
  type: 'switch';
  name: string;
  useComponentProps: () => {
    title: string | React.ReactNode;
    checked: boolean;
    onChange: (checked: boolean) => void;
  };
};

const videoWidthSettingItem: ModalSettingItemType = {
  type: 'modal',
  name: 'videoWidthSettingItem',
  useComponentProps: () => {
    const t = useT();
    const fieldSchema = useFieldSchema();
    const field = useField();
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    const schema = tableColumnSchema || fieldSchema;
    const { dn } = useDesignable();

    return {
      title: t('Video width'),
      schema: {
        type: 'object',
        title: (
          <span>
            {t('Video width')}
            <Tooltip title={t('Not set by default to 100% of the container.')}>
              <QuestionCircleOutlined style={{ marginLeft: 4, opacity: 0.65 }} />
            </Tooltip>
          </span>
        ),
        properties: {
          videoWidth: {
            default: schema['x-component-props']?.videoWidth,
            'x-decorator': 'FormItem',
            'x-component': 'InputNumber',
            'x-component-props': {},
          },
        },
      },
      onSubmit: ({ videoWidth }) => {
        schema['x-component-props'] ||= {};
        schema['x-component-props'].videoWidth = videoWidth;
        field.componentProps.videoWidth = videoWidth;
        dn.emit('patch', {
          schema: {
            ['x-uid']: schema['x-uid'],
            'x-component-props': {
              ...schema['x-component-props'],
            },
          },
        });
      },
    };
  },
};

const videoEmptyHeightSettingItem: ModalSettingItemType = {
  type: 'modal',
  name: 'videoEmptyHeightSettingItem',
  useComponentProps: () => {
    const t = useT();
    const fieldSchema = useFieldSchema();
    const field = useField();
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    const schema = tableColumnSchema || fieldSchema;
    const { dn } = useDesignable();

    return {
      title: t('Container height when URL is empty'),
      schema: {
        type: 'object',
        title: t('Container height when URL is empty'),
        properties: {
          emptyHeight: {
            default: schema['x-component-props']?.emptyHeight || 150,
            'x-decorator': 'FormItem',
            'x-component': 'InputNumber',
            'x-component-props': {},
          },
        },
      },
      onSubmit: ({ emptyHeight }) => {
        schema['x-component-props'] ||= {};
        schema['x-component-props'].emptyHeight = emptyHeight;
        field.componentProps.emptyHeight = emptyHeight;
        dn.emit('patch', {
          schema: {
            ['x-uid']: schema['x-uid'],
            'x-component-props': {
              ...schema['x-component-props'],
            },
          },
        });
      },
    };
  },
};

const videoAutoPlaySettingItem: SwitchSettingItemType = {
  type: 'switch',
  name: 'videoAutoPlaySettingItem',
  useComponentProps: () => {
    const t = useT();
    const fieldSchema = useFieldSchema();
    const field = useField();
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    const schema = tableColumnSchema || fieldSchema;
    const { dn } = useDesignable();

    return {
      title: t('Auto play'),
      checked: schema['x-component-props']?.videoAutoPlay,
      onChange: (checked) => {
        schema['x-component-props'] ||= {};
        schema['x-component-props'].videoAutoPlay = checked;
        field.componentProps.videoAutoPlay = checked;
        dn.emit('patch', {
          schema: {
            ['x-uid']: schema['x-uid'],
            'x-component-props': {
              ...schema['x-component-props'],
            },
          },
        });
      },
    };
  },
};

const videoMutedSettingItem: SwitchSettingItemType = {
  type: 'switch',
  name: 'videoMutedSettingItem',
  useComponentProps: () => {
    const t = useT();
    const fieldSchema = useFieldSchema();
    const field = useField();
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    const schema = tableColumnSchema || fieldSchema;
    const { dn } = useDesignable();

    return {
      title: t('Muted'),
      checked: schema['x-component-props']?.videoMuted ?? true,
      onChange: (checked) => {
        schema['x-component-props'] ||= {};
        schema['x-component-props'].videoMuted = checked;
        field.componentProps.videoMuted = checked;
        dn.emit('patch', {
          schema: {
            ['x-uid']: schema['x-uid'],
            'x-component-props': {
              ...schema['x-component-props'],
            },
          },
        });
      },
    };
  },
};

const videoShowControlsSettingItem: SwitchSettingItemType = {
  type: 'switch',
  name: 'videoShowControlsSettingItem',
  useComponentProps: () => {
    const t = useT();
    const fieldSchema = useFieldSchema();
    const field = useField();
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    const schema = tableColumnSchema || fieldSchema;
    const { dn } = useDesignable();

    return {
      title: t('Show video controls'),
      checked: schema['x-component-props']?.videoShowControls ?? true,
      onChange: (checked) => {
        schema['x-component-props'] ||= {};
        schema['x-component-props'].videoShowControls = checked;
        field.componentProps.videoShowControls = checked;
        dn.emit('patch', {
          schema: {
            ['x-uid']: schema['x-uid'],
            'x-component-props': {
              ...schema['x-component-props'],
            },
          },
        });
      },
    };
  },
};

const videoLoopSettingItem: SwitchSettingItemType = {
  type: 'switch',
  name: 'videoLoopSettingItem',
  useComponentProps: () => {
    const t = useT();
    const fieldSchema = useFieldSchema();
    const field = useField();
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    const schema = tableColumnSchema || fieldSchema;
    const { dn } = useDesignable();

    return {
      title: t('Loop playback'),
      checked: schema['x-component-props']?.videoLoop,
      onChange: (checked) => {
        schema['x-component-props'] ||= {};
        schema['x-component-props'].videoLoop = checked;
        field.componentProps.videoLoop = checked;
        dn.emit('patch', {
          schema: {
            ['x-uid']: schema['x-uid'],
            'x-component-props': {
              ...schema['x-component-props'],
            },
          },
        });
      },
    };
  },
};

const videoisLiveSettingItem: SwitchSettingItemType = {
  type: 'switch',
  name: 'videoisLiveSettingItem',
  useComponentProps: () => {
    const t = useT();
    const fieldSchema = useFieldSchema();
    const field = useField();
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    const schema = tableColumnSchema || fieldSchema;
    const { dn } = useDesignable();

    return {
      title: (
        <span>
          {t('Is live')}
          <Tooltip
            title={t(
              'If the live stream is not enabled, it can still play normally, but it may affect the buffering strategy of the underlying player, it is recommended to enable this item when playing live streams.',
            )}
          >
            <QuestionCircleOutlined style={{ marginLeft: 4, opacity: 0.65 }} />
          </Tooltip>
        </span>
      ),
      checked: schema['x-component-props']?.videoIsLive,
      onChange: (checked) => {
        schema['x-component-props'] ||= {};
        schema['x-component-props'].videoIsLive = checked;
        field.componentProps.videoIsLive = checked;
        dn.emit('patch', {
          schema: {
            ['x-uid']: schema['x-uid'],
            'x-component-props': {
              ...schema['x-component-props'],
            },
          },
        });
      },
    };
  },
};

export const videoPlayerComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:VideoPlayer',
  items: [
    videoisLiveSettingItem,
    videoWidthSettingItem,
    videoEmptyHeightSettingItem,
    videoAutoPlaySettingItem,
    videoMutedSettingItem,
    videoShowControlsSettingItem,
    videoLoopSettingItem,
  ],
});
