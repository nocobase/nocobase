/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UploadOutlined } from '@ant-design/icons';
import type { VscGitHubRemoteConfig } from '@nocobase/plugin-vsc-file';
import { Alert, Form, Radio, Space, Upload } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useT } from '../locale';
import LightExtensionGitSourceFields, {
  createEmptyLightExtensionGitSourceDraft,
  type LightExtensionGitHubSourceValue,
  type LightExtensionGitSourceDraft,
} from './LightExtensionGitSourceFields';
import type { LightExtensionEnvironmentVariableRecord } from './LightExtensionSecretVariableInput';

export type LightExtensionCreateSourceMode = 'template' | 'zip' | 'github';

export type LightExtensionCreateSource =
  | { mode: 'template' }
  | { mode: 'zip'; zipBase64: string }
  | {
      mode: 'github';
      provider: 'github';
      config: VscGitHubRemoteConfig;
      authRef?: string;
    };

export interface LightExtensionCreateSourceSelectorProps {
  defaultMode?: LightExtensionCreateSourceMode;
  disabled?: boolean;
  onChange?: (source: LightExtensionCreateSource | undefined) => void;
  readZipFile?: (file: Blob, errorMessage: string) => Promise<string>;
  loadEnvironmentVariables?: () => Promise<LightExtensionEnvironmentVariableRecord[]>;
}

export function readLightExtensionSourceZipAsBase64(file: Blob, errorMessage: string): Promise<string> {
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

export function LightExtensionCreateSourceSelector(props: LightExtensionCreateSourceSelectorProps) {
  const {
    defaultMode = 'template',
    disabled,
    onChange,
    readZipFile = readLightExtensionSourceZipAsBase64,
    loadEnvironmentVariables,
  } = props;
  const t = useT();
  const onChangeRef = useRef(onChange);
  const initialModeRef = useRef(defaultMode);
  const modeRef = useRef<LightExtensionCreateSourceMode>(initialModeRef.current);
  const zipReadVersionRef = useRef(0);
  const [mode, setMode] = useState<LightExtensionCreateSourceMode>(initialModeRef.current);
  const [zipFileList, setZipFileList] = useState<UploadFile[]>([]);
  const [zipError, setZipError] = useState<string>();
  const [gitDraft, setGitDraft] = useState<LightExtensionGitSourceDraft>(createEmptyLightExtensionGitSourceDraft);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onChangeRef.current?.(initialModeRef.current === 'template' ? { mode: 'template' } : undefined);
  }, []);

  const resetZip = useCallback(() => {
    zipReadVersionRef.current += 1;
    setZipFileList([]);
    setZipError(undefined);
  }, []);

  const resetGit = useCallback(() => {
    setGitDraft(createEmptyLightExtensionGitSourceDraft());
  }, []);

  const changeMode = useCallback(
    (nextMode: LightExtensionCreateSourceMode) => {
      if (mode === 'zip') {
        resetZip();
      }
      if (mode === 'github') {
        resetGit();
      }
      modeRef.current = nextMode;
      setMode(nextMode);
      onChange?.(nextMode === 'template' ? { mode: 'template' } : undefined);
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
    (source: LightExtensionGitHubSourceValue | undefined) => {
      onChange?.(source ? { mode: 'github', ...source } : undefined);
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
          onChange={(event) => changeMode(event.target.value as LightExtensionCreateSourceMode)}
          optionType="button"
          options={[
            { label: t('Template'), value: 'template' },
            { label: t('ZIP file'), value: 'zip' },
            { label: t('GitHub source'), value: 'github' },
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

      {mode === 'github' ? (
        <LightExtensionGitSourceFields
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

export default LightExtensionCreateSourceSelector;
