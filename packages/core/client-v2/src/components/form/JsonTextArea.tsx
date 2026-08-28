/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { Input, Typography } from 'antd';
import type { TextAreaProps } from 'antd/es/input';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import JSON5 from 'json5';
import React, { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FocusEvent } from 'react';

export interface JsonTextAreaProps extends Omit<TextAreaProps, 'value' | 'onChange'> {
  value?: unknown;
  onChange?: (value: unknown) => void;
  space?: number;
  json5?: boolean;
  showError?: boolean;
}

const jsonTextAreaClassName = css`
  font-size: 80%;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
`;

function stringifyJsonValue(value: unknown, json: typeof JSON | typeof JSON5, space: number) {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    try {
      json.parse(value);
      return value;
    } catch {
      return json.stringify(value, undefined, space) ?? '';
    }
  }

  return json.stringify(value, undefined, space) ?? '';
}

const JsonTextAreaComponent = React.forwardRef<TextAreaRef, JsonTextAreaProps>((props, ref) => {
  const {
    value,
    onChange,
    space = 2,
    json5 = false,
    showError = true,
    className,
    status,
    onBlur,
    ...textAreaProps
  } = props;
  const json = json5 ? JSON5 : JSON;
  const [text, setText] = useState(() => stringifyJsonValue(value, json, space));
  const [error, setError] = useState<string>();

  useEffect(() => {
    setText(stringifyJsonValue(value, json, space));
  }, [json, space, value]);

  const parseText = useCallback(
    (nextText: string) => {
      if (nextText.trim() === '') {
        return null;
      }

      return json.parse(nextText);
    },
    [json],
  );

  const validateText = useCallback(
    (nextText: string) => {
      try {
        parseText(nextText);
        setError(undefined);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [parseText],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const nextText = event.target.value;
      setText(nextText);
      validateText(nextText);
    },
    [validateText],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLTextAreaElement>) => {
      try {
        const parsed = parseText(event.target.value);
        setError(undefined);
        setText(parsed == null ? '' : json.stringify(parsed, undefined, space) ?? '');
        onChange?.(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }

      onBlur?.(event);
    },
    [json, onBlur, onChange, parseText, space],
  );

  const mergedStatus = useMemo(() => status || (error ? 'error' : undefined), [error, status]);

  return (
    <>
      <Input.TextArea
        autoSize={{
          minRows: 5,
          maxRows: 10,
        }}
        {...textAreaProps}
        ref={ref}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        status={mergedStatus}
        className={cx(jsonTextAreaClassName, className)}
      />
      {showError && error ? (
        <Typography.Text type="danger" style={{ display: 'block', marginTop: 4 }}>
          {error}
        </Typography.Text>
      ) : null}
    </>
  );
});

export const JsonTextArea = React.memo(JsonTextAreaComponent);

JsonTextArea.displayName = 'JsonTextArea';
