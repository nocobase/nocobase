/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type FieldConfigurePropertyComponentProps, RemoteSelect } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { Form } from 'antd';
import React, { useMemo } from 'react';
import { useT } from './locale';

type FileCollectionOption = {
  name: string;
  title?: React.ReactNode;
};

type FileCollectionSelectProps = FieldConfigurePropertyComponentProps;

type TranslationOptions = Record<string, unknown>;
type TranslationFunction = (key: string, options?: TranslationOptions) => string;

const LEGACY_T_TEMPLATE = /^\s*\{\{\s*t\s*\(\s*(['"])(.*?)\1(?:\s*,\s*([\s\S]*?))?\)\s*\}\}\s*$/;

function parseStringArray(source: string) {
  const values: string[] = [];
  source.replace(/(['"])(.*?)\1/g, (_item, _quote, value) => {
    values.push(value);
    return '';
  });
  return values.length ? values : undefined;
}

function parseTranslationOptions(source?: string): TranslationOptions | undefined {
  const value = source?.trim();
  if (!value) {
    return undefined;
  }

  try {
    const options = JSON.parse(value) as unknown;
    return options && typeof options === 'object' && !Array.isArray(options)
      ? (options as TranslationOptions)
      : undefined;
  } catch {
    // Keep support for old templates like {{t("Files", { ns: "plugin-files" })}}.
  }

  const options: TranslationOptions = {};
  const nsArrayMatch = value.match(/(?:^|[{,\s])ns\s*:\s*(\[[\s\S]*?\])/);
  if (nsArrayMatch?.[1]) {
    const ns = parseStringArray(nsArrayMatch[1]);
    if (ns) {
      options.ns = ns;
    }
  } else {
    const nsStringMatch = value.match(/(?:^|[{,\s])ns\s*:\s*(['"])(.*?)\1/);
    if (nsStringMatch?.[2]) {
      options.ns = nsStringMatch[2];
    }
  }

  const nsModeMatch = value.match(/(?:^|[{,\s])nsMode\s*:\s*(['"])(.*?)\1/);
  if (nsModeMatch?.[2]) {
    options.nsMode = nsModeMatch[2];
  }

  return Object.keys(options).length ? options : undefined;
}

export function compileFileCollectionTitle(value: React.ReactNode, t: TranslationFunction) {
  if (typeof value !== 'string') {
    return value;
  }
  const match = value.match(LEGACY_T_TEMPLATE);
  return match?.[2] ? t(match[2], parseTranslationOptions(match[3])) : value;
}

export function normalizeFileCollectionResponse(response: unknown): FileCollectionOption[] {
  const data = (response as { data?: unknown })?.data;
  const payload = (data as { data?: unknown })?.data ?? data;
  return Array.isArray(payload) ? payload : [];
}

export function FileCollectionSelect(props: FileCollectionSelectProps) {
  const ctx = useFlowContext();
  const t = useT();
  const form = Form.useFormInstance();
  const componentProps = props.componentProps || {};
  const request = useMemo(
    () => async () => {
      const response = await ctx.api.request({
        url: 'collections:listFileCollections',
        params: {
          paginate: false,
        },
      });
      return normalizeFileCollectionResponse(response);
    },
    [ctx.api],
  );

  return (
    <Form.Item
      name={props.namePath}
      label={props.title}
      tooltip={props.tooltip}
      rules={props.schema?.required ? [{ required: true }] : undefined}
    >
      <RemoteSelect<FileCollectionOption>
        {...componentProps}
        disabled={props.disabled}
        request={request}
        fieldNames={{ label: 'title', value: 'name' }}
        onLoaded={(items) => {
          const currentValue = form.getFieldValue(props.namePath);
          if (!currentValue && items.some((item) => item.name === 'attachments')) {
            form.setFieldValue(props.namePath, 'attachments');
          }
        }}
        mapOptions={(item) => ({
          value: item.name,
          label: compileFileCollectionTitle(item.title || item.name, t),
        })}
      />
    </Form.Item>
  );
}
