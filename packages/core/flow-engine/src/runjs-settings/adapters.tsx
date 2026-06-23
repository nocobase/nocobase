/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ColorPicker, DatePicker, Input } from 'antd';
import type { ColorPickerProps, DatePickerProps } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import React from 'react';
import type { RunJSSettingsJSONValue } from './types';

type RunJSSettingsDatePickerProps = Omit<DatePickerProps<Dayjs>, 'value' | 'onChange'> & {
  value?: string | null;
  onChange?: (value?: string) => void;
};

type RunJSSettingsColorPickerProps = Omit<ColorPickerProps, 'value' | 'onChange' | 'onClear'> & {
  value?: string | null;
  onChange?: (value?: string) => void;
};

type RunJSSettingsJSONTextAreaProps = Omit<React.ComponentProps<typeof Input.TextArea>, 'value' | 'onChange'> & {
  value?: RunJSSettingsJSONValue;
  onChange?: (value?: string) => void;
};

function parseDateValue(value: string | null | undefined): Dayjs | null {
  if (!value) {
    return null;
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

function firstDateString(value: string | string[]): string | undefined {
  const nextValue = Array.isArray(value) ? value[0] : value;
  return nextValue || undefined;
}

export function formatRunJSSettingsJSONTextAreaValue(value: RunJSSettingsJSONValue | undefined): string | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }
  return JSON.stringify(value, null, 2);
}

export function RunJSSettingsDatePicker({
  value,
  onChange,
  format = 'YYYY-MM-DD',
  ...props
}: RunJSSettingsDatePickerProps) {
  return (
    <DatePicker
      {...props}
      format={format}
      value={parseDateValue(value)}
      onChange={(_date, dateString) => {
        onChange?.(firstDateString(dateString));
      }}
    />
  );
}

export function RunJSSettingsDateTimePicker({
  value,
  onChange,
  showTime = true,
  ...props
}: RunJSSettingsDatePickerProps) {
  return (
    <DatePicker
      {...props}
      showTime={showTime}
      value={parseDateValue(value)}
      onChange={(date) => {
        onChange?.(date ? date.toISOString() : undefined);
      }}
    />
  );
}

export function RunJSSettingsColorPicker({
  value,
  onChange,
  allowClear = true,
  disabledAlpha = true,
  format = 'hex',
  ...props
}: RunJSSettingsColorPickerProps) {
  return (
    <ColorPicker
      {...props}
      allowClear={allowClear}
      disabledAlpha={disabledAlpha}
      format={format}
      value={value || undefined}
      onChange={(color) => {
        onChange?.(color.toHexString().toUpperCase());
      }}
      onClear={() => {
        onChange?.(undefined);
      }}
    />
  );
}

export function RunJSSettingsJSONTextArea({
  value,
  onChange,
  autoSize = { minRows: 6 },
  ...props
}: RunJSSettingsJSONTextAreaProps) {
  const [draftText, setDraftText] = React.useState(() => formatRunJSSettingsJSONTextAreaValue(value));
  const internalTextRef = React.useRef<string | undefined>();

  React.useEffect(() => {
    if (Object.is(internalTextRef.current, value)) {
      return;
    }
    internalTextRef.current = undefined;
    setDraftText(formatRunJSSettingsJSONTextAreaValue(value));
  }, [value]);

  return (
    <Input.TextArea
      {...props}
      autoSize={autoSize}
      value={draftText}
      onChange={(event) => {
        const nextText = event.target.value;
        internalTextRef.current = nextText;
        setDraftText(nextText);
        onChange?.(nextText);
      }}
    />
  );
}
