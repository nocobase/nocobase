import { Button, Dropdown, Input, InputNumber } from 'antd';
import classNames from 'classnames';
import type { FC } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { useDebouncyFn } from 'use-debouncy';
import ColorPanel from './ColorPanel';
import ColorPreview from './ColorPreview';
import type { MutableTheme } from './interface';
import { useLocale } from './locale';
import isColor from './utils/isColor';
import makeStyle from './utils/makeStyle';

const useStyle = makeStyle('TokenInput', (token) => ({
  '.previewer-token-input': {
    [`${token.rootCls}-input-group-addon, ${token.rootCls}-input-number-group-addon`]: {
      border: '0 !important',
      color: `rgba(0, 0, 0, 0.25) !important`,
      fontSize: `${token.fontSizeSM}px !important`,
      padding: '0 !important',
      backgroundColor: 'transparent !important',

      '&:first-child': {
        paddingInlineStart: 0,
      },

      '&:last-child': {
        paddingInlineEnd: 0,
      },
    },

    [`${token.rootCls}-input-group-wrapper, ${token.rootCls}-input-number-group-wrapper`]: {
      padding: 0,
      height: 24,
      width: '100%',

      input: {
        fontSize: token.fontSizeSM,
        lineHeight: token.lineHeightSM,
        padding: `2px ${token.paddingXS}px`,
        height: 24,
      },
    },

    [`${token.rootCls}-input-group-wrapper ${token.rootCls}-input, ${token.rootCls}-input-number-group-wrapper ${token.rootCls}-input-number`]:
      {
        background: 'white',
        borderRadius: `${token.borderRadiusLG}px !important`,
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      },

    '&&-light': {
      [`${token.rootCls}-input-group-addon, ${token.rootCls}-input-number-group-addon`]: {
        backgroundColor: token.colorBgContainer,
      },

      [`${token.rootCls}-input-group-wrapper ${token.rootCls}-input,
        ${token.rootCls}-input-number-group-wrapper ${token.rootCls}-input-number-input`]: {
        background: token.colorFillAlter,
      },
    },

    '&&-readonly': {
      input: {
        cursor: 'text',
        color: token.colorText,
      },
    },
  },
}));

type TokenInputProps = {
  theme?: MutableTheme;
  value?: string | number;
  onChange?: (value: string | number) => void;
  light?: boolean;
  readonly?: boolean;
  onReset?: () => void;
  canReset?: boolean;
  hideTheme?: boolean;
};

const TokenInput: FC<TokenInputProps> = ({
  value,
  theme,
  onChange,
  light,
  readonly,
  onReset,
  canReset: customCanReset,
  hideTheme,
}) => {
  const valueRef = useRef<number | string>(value || '');
  const [tokenValue, setTokenValue] = useState<string | number>(value || '');
  const canReset = customCanReset ?? valueRef.current !== tokenValue;
  const locale = useLocale();

  const [wrapSSR, hashId] = useStyle();

  useEffect(() => {
    if (value !== undefined) {
      setTokenValue(value);
    }
  }, [value]);

  const debouncedOnChange = useDebouncyFn((newValue: number | string) => {
    onChange?.(newValue);
  }, 500);

  const handleTokenChange = (newValue: number | string) => {
    if (!readonly) {
      setTokenValue(newValue);
      debouncedOnChange(newValue);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      handleTokenChange(valueRef.current);
    }
  };

  const addonAfter = !readonly && (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        minWidth: hideTheme ? '' : 80,
      }}
    >
      {canReset || hideTheme ? (
        <Button
          style={{
            fontSize: 12,
          }}
          onClick={handleReset}
          type="link"
          size="small"
          disabled={!canReset}
        >
          {locale.reset}
        </Button>
      ) : (
        <span style={{ padding: '0 8px' }}>{theme?.name}</span>
      )}
    </span>
  );

  let inputNode;
  if (typeof valueRef.current === 'string' && isColor(valueRef.current)) {
    inputNode = (
      <Input
        bordered={false}
        addonAfter={addonAfter}
        value={String(tokenValue)}
        disabled={readonly}
        addonBefore={
          <Dropdown
            trigger={['click']}
            overlay={
              <ColorPanel
                alpha
                color={String(tokenValue)}
                onChange={(v: string) => {
                  handleTokenChange(v);
                }}
              />
            }
          >
            <ColorPreview
              color={String(tokenValue)}
              dark={theme?.key === 'dark'}
              style={{
                cursor: 'pointer',
                marginInlineEnd: 8,
                verticalAlign: 'top',
              }}
            />
          </Dropdown>
        }
        onChange={(e) => {
          handleTokenChange(e.target.value);
        }}
      />
    );
  } else if (typeof valueRef.current === 'number') {
    inputNode = (
      <InputNumber
        addonAfter={addonAfter}
        bordered={false}
        value={tokenValue}
        disabled={readonly}
        onChange={(newValue) => {
          handleTokenChange(Number(newValue));
        }}
      />
    );
  } else {
    inputNode = (
      <Input
        addonAfter={addonAfter}
        bordered={false}
        value={String(tokenValue)}
        disabled={readonly}
        onChange={(e) => {
          handleTokenChange(typeof value === 'number' ? Number(e.target.value) : e.target.value);
        }}
      />
    );
  }
  return wrapSSR(
    <div
      className={classNames('previewer-token-input', hashId, {
        'previewer-token-input-light': light,
        'previewer-token-input-readonly': readonly,
      })}
    >
      {inputNode}
    </div>,
  );
};

export default TokenInput;
