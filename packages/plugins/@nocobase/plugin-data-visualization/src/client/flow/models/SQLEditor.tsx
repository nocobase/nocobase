/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useRef } from 'react';
import { connect, mapProps, useForm } from '@formily/react';
import { Select, Form } from 'antd';
import { CodeEditor, CodeEditorHandle } from '../components/CodeEditor';
import { FlowContextSelector, observer, useFlowContext } from '@nocobase/flow-engine';
import { useDataSourceManager, useCompile, DEFAULT_DATA_SOURCE_KEY } from '@nocobase/client';
import { useT } from '../../locale';

const SQLEditorBase: React.FC<any> = observer((props) => {
  const { value, onChange } = props;
  const editorRef = useRef<CodeEditorHandle>(null);
  const ctx = useFlowContext();

  const form = useForm();
  const dm = useDataSourceManager();
  const compile = useCompile();
  const t = useT();

  // 数据源选项
  const dsOptions = React.useMemo(() => {
    const all = dm.getAllCollections();
    return all
      .filter(({ key, isDBInstance }: any) => key === DEFAULT_DATA_SOURCE_KEY || isDBInstance)
      .map(({ key, displayName }: any) => ({ value: key, label: compile(displayName) }));
  }, [dm, compile]);

  // 当前 SQL 模式的数据源（默认 main）
  const sqlDsKey = form?.values?.query?.sqlDatasource ?? DEFAULT_DATA_SOURCE_KEY;
  const onDsChange = (key: string) => {
    form?.setValuesIn?.('query.sqlDatasource', key);
  };

  return (
    <div>
      {/* 选择数据源 */}
      <Form.Item label={t('Data source')} rules={[{ required: true }]} style={{ marginTop: 8 }}>
        <Select
          style={{ width: 222 }}
          placeholder={t('Data source')}
          options={dsOptions}
          value={sqlDsKey}
          onChange={onDsChange}
        />
      </Form.Item>

      {/* SQL 编辑器 */}
      <CodeEditor
        ref={editorRef}
        language="sql"
        value={value}
        onChange={onChange}
        rightExtra={
          <FlowContextSelector
            onChange={(val) => {
              if (!val) return;
              editorRef.current?.insertAtCursor(val);
            }}
            metaTree={() => ctx.getPropertyMetaTree()}
          />
        }
      />
    </div>
  );
});

export const SQLEditor = connect(
  SQLEditorBase,
  mapProps((props) => ({
    value: props.value,
    onChange: props.onChange,
  })),
);
