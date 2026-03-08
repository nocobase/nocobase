/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckOutlined } from '@ant-design/icons';
import { Popover, theme } from 'antd';
import type { ButtonProps } from 'antd/es/button';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const ANTD_DEFAULT_SEED = theme.defaultSeed as Record<string, string>;

export const LEGACY_TYPE_TO_VARIANT: Record<string, ButtonProps['variant']> = {
  default: 'outlined',
  primary: 'solid',
  dashed: 'dashed',
  link: 'link',
  text: 'text',
};

export const ANTD_BUTTON_COLORS = [
  'default',
  'primary',
  'danger',
  'blue',
  'purple',
  'cyan',
  'green',
  'magenta',
  'pink',
  'red',
  'orange',
  'yellow',
  'volcano',
  'geekblue',
  'lime',
  'gold',
] as const;

export type AntdButtonColor = (typeof ANTD_BUTTON_COLORS)[number];

const ANTD_BUTTON_COLOR_SET = new Set<AntdButtonColor>(ANTD_BUTTON_COLORS);

export const isAntdButtonColor = (value?: string): value is AntdButtonColor => {
  if (!value) {
    return false;
  }
  return ANTD_BUTTON_COLOR_SET.has(value as AntdButtonColor);
};

const BUTTON_COLOR_OPTIONS: Array<{ value?: AntdButtonColor; labelKey: string }> = [
  { value: undefined, labelKey: 'Clear' },
  { value: 'default', labelKey: 'Default' },
  { value: 'primary', labelKey: 'Primary' },
  { value: 'danger', labelKey: 'Danger red' },
  { value: 'blue', labelKey: 'Blue' },
  { value: 'purple', labelKey: 'Purple' },
  { value: 'cyan', labelKey: 'Cyan' },
  { value: 'green', labelKey: 'Green' },
  { value: 'magenta', labelKey: 'Magenta' },
  { value: 'pink', labelKey: 'Pink' },
  { value: 'red', labelKey: 'Red' },
  { value: 'orange', labelKey: 'Orange' },
  { value: 'yellow', labelKey: 'Yellow' },
  { value: 'volcano', labelKey: 'Volcano' },
  { value: 'geekblue', labelKey: 'Geek blue' },
  { value: 'lime', labelKey: 'Lime' },
  { value: 'gold', labelKey: 'Gold' },
];

const getColorHex = (
  color: AntdButtonColor | undefined,
  token: { colorBgContainer: string; colorBorder: string; colorError: string },
) => {
  if (!color) {
    return token.colorBgContainer;
  }
  if (color === 'default') {
    return token.colorBgContainer;
  }
  if (color === 'primary') {
    return ANTD_DEFAULT_SEED.colorPrimary;
  }
  if (color === 'danger') {
    return ANTD_DEFAULT_SEED.colorError;
  }
  return ANTD_DEFAULT_SEED[color] || token.colorBorder;
};

const getSwatchBackground = (
  color: AntdButtonColor | undefined,
  token: { colorBgContainer: string; colorFillSecondary: string; colorBorder: string; colorError: string },
) => {
  if (color === 'default') {
    return `linear-gradient(135deg, ${token.colorBgContainer} 0%, ${token.colorBgContainer} 52%, ${token.colorFillSecondary} 52%, ${token.colorFillSecondary} 100%)`;
  }
  return getColorHex(color, token);
};

type ButtonColorPanelProps = {
  value?: AntdButtonColor;
  onChange?: (value?: AntdButtonColor) => void;
  disabled?: boolean;
};

export const ButtonColorPanel: React.FC<ButtonColorPanelProps> = ({ value, onChange, disabled }) => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    const selected = BUTTON_COLOR_OPTIONS.find((option) => option.value === value);
    return t(selected?.labelKey || 'Clear');
  }, [value, t]);

  const trigger = (
    <div
      role="button"
      aria-label="button-color-trigger"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(event) => {
        if (disabled) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setOpen((prev) => !prev);
        }
      }}
      style={{
        width: 40,
        height: 40,
        borderRadius: token.borderRadius,
        border: `1px solid ${token.colorBorder}`,
        background: token.colorBgContainer,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: open ? `0 0 0 2px ${token.colorPrimaryBorder}` : 'none',
      }}
    >
      {!value ? (
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            border: `1px solid ${token.colorBorder}`,
            background: token.colorBgContainer,
            position: 'relative',
            display: 'inline-block',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 18,
              height: 2,
              background: token.colorError,
              borderRadius: 1,
              transform: 'translate(-50%, -50%) rotate(-45deg)',
            }}
          />
        </span>
      ) : (
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            border: `1px solid ${value === 'default' ? token.colorBorder : 'transparent'}`,
            background: getSwatchBackground(value, token),
            position: 'relative',
          }}
        >
          {value === 'default' ? (
            <span
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 6,
                height: 6,
                borderRadius: 999,
                background: token.colorTextSecondary,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ) : null}
        </span>
      )}
    </div>
  );

  const content = (
    <div style={{ width: 360, maxWidth: 'calc(100vw - 40px)' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 8,
        }}
      >
        {BUTTON_COLOR_OPTIONS.map((option) => {
          const active = value === option.value;
          const colorHex = getSwatchBackground(option.value, token);
          const isClearOption = !option.value;
          return (
            <div
              key={option.value || '__clear__'}
              role="button"
              aria-label={`button-color-${option.value || 'clear'}`}
              aria-pressed={active}
              tabIndex={disabled ? -1 : 0}
              onClick={() => {
                if (disabled) {
                  return;
                }
                onChange?.(option.value);
                setOpen(false);
              }}
              onKeyDown={(event) => {
                if (disabled) {
                  return;
                }
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onChange?.(option.value);
                  setOpen(false);
                }
              }}
              style={{
                borderRadius: token.borderRadius,
                border: `1px solid ${active ? token.colorPrimary : token.colorBorder}`,
                background: active ? token.colorPrimaryBg : token.colorBgContainer,
                padding: '8px 6px 6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 4,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                minHeight: 0,
                position: 'relative',
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 4,
                  background: colorHex,
                  border: `1px solid ${
                    option.value === 'default' || isClearOption ? token.colorBorder : 'transparent'
                  }`,
                  position: 'relative',
                }}
              >
                {isClearOption ? (
                  <span
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: 20,
                      height: 2,
                      background: token.colorError,
                      borderRadius: 1,
                      transform: 'translate(-50%, -50%) rotate(-45deg)',
                    }}
                  />
                ) : option.value === 'default' ? (
                  <span
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: token.colorTextSecondary,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ) : null}
              </span>
              <span style={{ fontSize: 12, lineHeight: '16px', textAlign: 'center' }}>{t(option.labelKey)}</span>
              {active ? (
                <CheckOutlined style={{ color: token.colorPrimary, position: 'absolute', right: 6, top: 6 }} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Popover
        trigger={['hover', 'click']}
        placement="bottomLeft"
        content={content}
        open={disabled ? false : open}
        onOpenChange={setOpen}
        destroyTooltipOnHide
      >
        {trigger}
      </Popover>
      <span style={{ fontSize: 12, color: token.colorTextDescription }}>{selectedLabel}</span>
    </div>
  );
};

export default ButtonColorPanel;
