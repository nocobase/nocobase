/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UploadOutlined } from '@ant-design/icons';
import type { VscGitRemoteConfigDraft } from '../../shared/vsc-file/remote-sync-types';
import { Alert, Form, Radio, Space, Upload } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useT } from '../locale';
import JsTemplateGitSourceFields, {
  createEmptyJsTemplateGitSourceDraft,
  type JsTemplateGitSourceValue,
  type JsTemplateGitSourceDraft,
} from './JsTemplateGitSourceFields';
import type { JsTemplateEnvironmentVariableRecord } from './JsTemplateSecretVariableInput';

export type JsTemplateCreateSourceMode = 'starter' | 'zip' | 'git';

export type JsTemplateCreateSource =
  | { mode: 'starter' }
  | { mode: 'zip'; zipBase64: string }
  | {
      mode: 'git';
      provider: 'git';
      config: VscGitRemoteConfigDraft;
      authRef?: string;
    };

export interface JsTemplateCreateSourceSelectorProps {
  defaultMode?: JsTemplateCreateSourceMode;
  disabled?: boolean;
  onChange?: (source: JsTemplateCreateSource | undefined) => void;
  readZipFile?: (file: Blob, errorMessage: string) => Promise<string>;
  loadEnvironmentVariables?: () => Promise<JsTemplateEnvironmentVariableRecord[]>;
}

export function readJsTemplateSourceZipAsBase64(file: Blob, errorMessage: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const separatorIndex = result.indexOf(',');
      if (separatorIndex < 0) {
        reject(new Error(errorMessage));
        return;
      }
      resolve(result.slice(separatorIndex + 1));
    };
    reader.onerror = () => reject(new Error(errorMessage));
    reader.readAsDataURL(file);
  });
}

export function JsTemplateCreateSourceSelector(props: JsTemplateCreateSourceSelectorProps) {
  const {
    defaultMode = 'starter',
    disabled,
    onChange,
    readZipFile = readJsTemplateSourceZipAsBase64,
    loadEnvironmentVariables,
  } = props;
  const t = useT();
  const onChangeRef = useRef(onChange);
  const initialModeRef = useRef(defaultMode);
  const modeRef = useRef<JsTemplateCreateSourceMode>(initialModeRef.current);
  const zipReadVersionRef = useRef(0);
  const [mode, setMode] = useState<JsTemplateCreateSourceMode>(initialModeRef.current);
  const [zipFileList, setZipFileList] = useState<UploadFile[]>([]);
  const [zipError, setZipError] = useState<string>();
  const [gitDraft, setGitDraft] = useState<JsTemplateGitSourceDraft>(createEmptyJsTemplateGitSourceDraft);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onChangeRef.current?.(initialModeRef.current === 'starter' ? { mode: 'starter' } : undefined);
  }, []);

  const resetZip = useCallback(() => {
    zipReadVersionRef.current += 1;
    setZipFileList([]);
    setZipError(undefined);
  }, []);

  const resetGit = useCallback(() => {
    setGitDraft(createEmptyJsTemplateGitSourceDraft());
  }, []);

  const changeMode = useCallback(
    (nextMode: JsTemplateCreateSourceMode) => {
      if (mode === 'zip') {
        resetZip();
      }
      if (mode === 'git') {
        resetGit();
      }
      modeRef.current = nextMode;
      setMode(nextMode);
      onChange?.(nextMode === 'starter' ? { mode: 'starter' } : undefined);
    },
    [mode, onChange, resetGit, resetZip],
  );

  const readSourceZip = useCallback(
    async (file: RcFile) => {
      const readVersion = zipReadVersionRef.current + 1;
      zipReadVersionRef.current = readVersion;
      setZipError(undefined);
      onChange?.(undefined);
      try {
        const zipBase64 = await readZipFile(file, t('Failed to read source ZIP'));
        if (modeRef.current !== 'zip' || zipReadVersionRef.current !== readVersion) {
          return;
        }
        setZipFileList([{ uid: file.uid, name: file.name, status: 'done' }]);
        onChange?.({ mode: 'zip', zipBase64 });
      } catch (error) {
        if (modeRef.current !== 'zip' || zipReadVersionRef.current !== readVersion) {
          return;
        }
        resetZip();
        setZipError(error instanceof Error ? error.message : t('Failed to read source ZIP'));
      }
    },
    [onChange, readZipFile, resetZip, t],
  );

  const handleGitSourceChange = useCallback(
    (source: JsTemplateGitSourceValue | undefined) => {
      onChange?.(source ? { mode: 'git', ...source } : undefined);
    },
    [onChange],
  );

  return (
    <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
      <Form.Item label={t('Source')} required>
        <Radio.Group
          aria-label={t('Source')}
          buttonStyle="solid"
          disabled={disabled}
          onChange={(event) => changeMode(event.target.value as JsTemplateCreateSourceMode)}
          optionType="button"
          options={[
            { label: t('Starter'), value: 'starter' },
            { label: t('ZIP file'), value: 'zip' },
            { label: t('Git source'), value: 'git' },
          ]}
          value={mode}
        />
      </Form.Item>

      {mode === 'zip' ? (
        <Form.Item label={t('Source ZIP')} required>
          <Upload.Dragger
            accept=".zip,application/zip,application/x-zip-compressed"
            beforeUpload={async (file) => {
              await readSourceZip(file);
              return false;
            }}
            disabled={disabled}
            fileList={zipFileList}
            maxCount={1}
            onRemove={() => {
              resetZip();
              onChange?.(undefined);
              return true;
            }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">{t('Click or drag a source ZIP file to this area')}</p>
          </Upload.Dragger>
          {zipError ? <Alert message={zipError} role="alert" showIcon type="error" /> : null}
        </Form.Item>
      ) : null}

      {mode === 'git' ? (
        <JsTemplateGitSourceFields
          disabled={disabled}
          loadEnvironmentVariables={loadEnvironmentVariables}
          onChange={setGitDraft}
          onValidSourceChange={handleGitSourceChange}
          value={gitDraft}
        />
      ) : null}
    </Space>
  );
}

export default JsTemplateCreateSourceSelector;
