/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useRef } from 'react';
import { Select, Form } from 'antd';
import { CodeEditor, CodeEditorHandle } from '../components/CodeEditor';
import { FlowContextSelector, observer, useFlowContext } from '@nocobase/flow-engine';
import { DEFAULT_DATA_SOURCE_KEY } from '@nocobase/client-v2';
import { useT } from '../../locale';
import { useCompile } from '../utils';
import { getDataSourceCapabilities } from './QueryBuilder.service';

export const SQLEditor: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
  dataSource?: string;
  onDataSourceChange?: (value: string) => void;
}> = observer((props) => {
  const { value, onChange, dataSource, onDataSourceChange } = props;
  const editorRef = useRef<CodeEditorHandle>(null);
  const ctx = useFlowContext();

  const dm = ctx?.dataSourceManager;
  const compile = useCompile();
  const t = useT();

  // 数据源选项
  const dsOptions = React.useMemo(() => {
    const dataSources = dm?.getDataSources?.() || [];
    return dataSources
      .filter(
        (dataSource: any) =>
          dataSource?.key === DEFAULT_DATA_SOURCE_KEY ||
          dataSource?.options?.isDBInstance ||
          dataSource?.isDBInstance ||
          getDataSourceCapabilities(dataSource)?.runSQL,
      )
      .map(({ key, displayName }: any) => ({ value: key, label: compile(displayName) }));
  }, [dm, compile]);

  // 当前 SQL 模式的数据源（默认 main）
  const sqlDsKey = dataSource ?? DEFAULT_DATA_SOURCE_KEY;
  const onDsChange = (key: string) => {
    onDataSourceChange?.(key);
  };

  return (
    <div>
      <Form.Item
        label={<span style={{ fontWeight: 500 }}>{t('Data source')}</span>}
        rules={[{ required: true }]}
        style={{ marginTop: 8 }}
      >
        <Select
          style={{ width: 222 }}
          placeholder={t('Data source')}
          options={dsOptions}
          value={sqlDsKey}
          onChange={onDsChange}
        />
      </Form.Item>

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
