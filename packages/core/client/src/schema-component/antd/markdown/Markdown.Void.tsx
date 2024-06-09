/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField, useFieldSchema } from '@formily/react';
import { Input as AntdInput, Button, Space, Spin, theme } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import cls from 'classnames';
import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlobalTheme } from '../../../global-theme';
import { useDesignable } from '../../hooks/useDesignable';
import { MarkdownVoidDesigner } from './Markdown.Void.Designer';
import { useStyles } from './style';
import { parseMarkdown } from './util';
import { TextAreaProps } from 'antd/es/input';
import { useBlockHeight } from '../../hooks/useBlockSize';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { useCollectionRecord } from '../../../data-source';
import { useVariableOptions } from '../../../schema-settings/VariableInput/hooks/useVariableOptions';
import { VariableSelect } from '../variable/VariableSelect';
import { replaceVariableValue } from '../../../block-provider/hooks';
import { useLocalVariables, useVariables } from '../../../variables';
import { registerQrcodeWebcom } from './qrcode-webcom';
export interface MarkdownEditorProps extends Omit<TextAreaProps, 'onSubmit'> {
  scope: any[];
  defaultValue?: string;
  onSubmit?: (value: string) => void;
  onCancel?: (e: React.MouseEvent) => void;
}

const MarkdownEditor = (props: MarkdownEditorProps) => {
  const { scope } = props;
  const { t } = useTranslation();
  const [value, setValue] = useState(props.defaultValue);
  const inputRef = useRef<TextAreaRef>(null);
  const [options, setOptions] = useState([]);
  const [curPos, setCurPos] = useState(null);
  useEffect(() => {
    setOptions(scope);
  }, [scope]);

  useEffect(() => {
    const inputEle = inputRef?.current?.resizableTextArea?.textArea;
    if (curPos && inputEle) {
      inputEle.setSelectionRange(curPos, curPos);
    }
  }, [curPos]);

  const onInsert = useCallback(
    function (paths: string[]) {
      const variable: string[] = paths.filter((key) => Boolean(key.trim()));
      const { current } = inputRef;
      const inputEle = current?.resizableTextArea?.textArea;
      if (!inputEle || !variable) {
        return;
      }
      current.focus();
      const templateVar = `{{${paths.join('.')}}}`;
      const startPos = inputEle.selectionStart || 0;
      const newVal = value.substring(0, startPos) + templateVar + value.substring(startPos, value.length);
      const newPos = startPos + templateVar.length;
      setValue(newVal);
      setCurPos(newPos);
    },
    [value],
  );
  return (
    <div className={'mb-markdown'} style={{ position: 'relative' }}>
      <AntdInput.TextArea
        ref={inputRef}
        autoSize={{ minRows: 3 }}
        {...(props as any)}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
      />
      <div style={{ position: 'absolute', top: 1, right: 1 }}>
        <VariableSelect options={options} setOptions={setOptions} onInsert={onInsert} />
      </div>

      <Space style={{ position: 'absolute', bottom: 5, right: 5 }}>
        <Button
          onClick={(e) => {
            props.onCancel?.(e);
          }}
        >
          {t('Cancel')}
        </Button>
        <Button
          type={'primary'}
          onClick={() => {
            props.onSubmit?.(value);
          }}
        >
          {t('Save')}
        </Button>
      </Space>
    </div>
  );
};

const useMarkdownHeight = () => {
  const { token } = theme.useToken();
  const height = useBlockHeight();
  if (!height) {
    return;
  }
  return height - 2 * token.paddingLG;
};

export const MarkdownVoid: any = withDynamicSchemaProps(
  observer((props: any) => {
    const { isDarkTheme } = useGlobalTheme();
    const { componentCls, hashId } = useStyles({ isDarkTheme });
    const { content, className } = props;
    const field = useField();
    const schema = useFieldSchema();
    const { dn } = useDesignable();
    const { onSave, onCancel, form } = props;
    const record = useCollectionRecord();
    const [html, setHtml] = useState('');
    const variables = useVariables();
    const localVariables = useLocalVariables();
    const [loading, setLoading] = useState(false);
    useEffect(() => {
      setLoading(true);
      const cvtContentToHTML = async () => {
        const replacedContent = await replaceVariableValue(content, variables, localVariables);
        const html = await parseMarkdown(replacedContent);
        setHtml(html);
        setLoading(false);
      };
      cvtContentToHTML();
    }, [content, variables, localVariables]);
    const height = useMarkdownHeight();
    const scope = useVariableOptions({
      collectionField: { uiSchema: schema },
      form,
      record,
      uiSchema: schema,
      noDisabled: true,
    });

    useEffect(() => {
      registerQrcodeWebcom();
    }, []);
    if (loading) return <Spin />;
    return field?.editable ? (
      <MarkdownEditor
        scope={scope}
        {...props}
        className
        defaultValue={content}
        onCancel={() => {
          field.editable = false;
          onCancel?.();
        }}
        onSubmit={async (value) => {
          field.editable = false;
          schema['x-component-props'] ?? (schema['x-component-props'] = {});
          schema['x-component-props']['content'] = value;
          field.componentProps.content = value;
          onSave?.(schema);
          dn.emit('patch', {
            schema: {
              'x-uid': schema['x-uid'],
              'x-component-props': {
                content: value,
              },
            },
          });
        }}
      />
    ) : (
      <div
        className={cls([componentCls, hashId, 'nb-markdown nb-markdown-default nb-markdown-table', className])}
        style={{ ...props.style, height: height || '100%', overflow: 'auto' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }),
  { displayName: 'MarkdownVoid' },
);

MarkdownVoid.Designer = MarkdownVoidDesigner;
