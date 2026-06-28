/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CodeOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React from 'react';
import { CodeEditor, type RunJSEditorProvider, type RunJSEditorProviderRenderProps } from '@nocobase/client-v2';

import { useT } from '../locale';

export const runJSStudioProvider: RunJSEditorProvider = {
  key: '@nocobase/plugin-vsc-file/runjs-studio',
  canHandle: (props) => Boolean(props.locator),
  renderEditor: (props) => <RunJSStudioEditorEntry {...props} />,
};

function RunJSStudioEditorEntry(props: RunJSEditorProviderRenderProps) {
  const {
    t: hostT,
    value,
    onChange,
    height = '200px',
    scene = 'formValue',
    readOnly,
    disabled,
    containerStyle = { flex: 1, minWidth: 0 },
  } = props;
  const t = useT();
  const translate = hostT || t;
  const tip = translate('Use return to output value');
  const studioTitle = t('Open RunJS Studio');
  const pendingTitle = t('RunJS Studio workspace will be available after this source is connected');

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 8 }}>
        <Tooltip title={pendingTitle}>
          <Button aria-label={studioTitle} disabled icon={<CodeOutlined />} type="default">
            {studioTitle}
          </Button>
        </Tooltip>
      </div>
      <CodeEditor
        value={value.code}
        onChange={(code) => onChange?.({ ...value, code })}
        version={value.version}
        height={height}
        enableLinter
        placeholder={`// ${tip}`}
        scene={scene}
        readonly={readOnly || disabled}
      />
    </div>
  );
}
