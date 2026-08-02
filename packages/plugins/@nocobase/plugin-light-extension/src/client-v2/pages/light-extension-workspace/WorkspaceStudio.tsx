/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ImportOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Tooltip, theme } from 'antd';
import React from 'react';
import { createPortal } from 'react-dom';

import type { LightExtensionDiagnostic } from '../../../shared/types';
import DiagnosticsPanel from '../../components/DiagnosticsPanel';
import { CodeTab, FilesPanel, VersionHistoryDock } from '../../vsc-file/public-api';

export interface WorkspaceStudioProps {
  activeFileReadOnlyNotice?: string;
  codeTabProps: Omit<React.ComponentProps<typeof CodeTab>, 'toolbarActions'>;
  diagnostics: LightExtensionDiagnostic[];
  embedded: boolean;
  emptyRepositoryLabel: string;
  filesCollapsed: boolean;
  filesPanelProps: React.ComponentProps<typeof FilesPanel>;
  fullscreen: {
    container: HTMLElement | null;
    isFullscreen: boolean;
    placeholderRef: React.RefCallback<HTMLDivElement>;
    placeholderStyle: React.CSSProperties;
    toggleFullscreen: () => void;
  };
  hasFiles: boolean;
  moveToInline?: {
    label: string;
    loading: boolean;
    onClick: () => void;
  };
  onOpenDiagnostic: (diagnostic: LightExtensionDiagnostic) => void;
  versionHistoryProps: React.ComponentProps<typeof VersionHistoryDock>;
}

export function WorkspaceStudio(props: WorkspaceStudioProps) {
  const {
    activeFileReadOnlyNotice,
    codeTabProps,
    diagnostics,
    embedded,
    emptyRepositoryLabel,
    filesCollapsed,
    filesPanelProps,
    fullscreen,
    hasFiles,
    moveToInline,
    onOpenDiagnostic,
    versionHistoryProps,
  } = props;
  const { token } = theme.useToken();

  return (
    <>
      <div
        ref={fullscreen.placeholderRef}
        style={fullscreen.isFullscreen ? fullscreen.placeholderStyle : { display: 'contents' }}
      />
      {fullscreen.container
        ? createPortal(
            <div
              data-testid="light-extension-runjs-studio-workspace"
              style={{
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadiusLG,
                display: 'flex',
                flex: embedded || fullscreen.isFullscreen ? '1 1 0' : undefined,
                flexDirection: 'column',
                height: fullscreen.isFullscreen ? '100%' : undefined,
                minHeight: embedded || fullscreen.isFullscreen ? 0 : 520,
                minWidth: 0,
                overflow: 'hidden',
                width: fullscreen.isFullscreen ? '100%' : undefined,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  flex: '1 1 0',
                  gridTemplateColumns: filesCollapsed ? 'minmax(0, 1fr)' : 'minmax(220px, 260px) minmax(0, 1fr)',
                  minHeight: 0,
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                {!filesCollapsed ? (
                  <div
                    style={{
                      background: token.colorFillAlter,
                      borderRight: `1px solid ${token.colorBorderSecondary}`,
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 0,
                      minWidth: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <FilesPanel {...filesPanelProps} />
                    <VersionHistoryDock {...versionHistoryProps} />
                  </div>
                ) : null}

                <main
                  style={{
                    display: 'flex',
                    flex: '1 1 0',
                    flexDirection: 'column',
                    minHeight: 0,
                    minWidth: 0,
                    overflow: 'hidden',
                    padding: 12,
                  }}
                >
                  {!hasFiles ? <Empty description={emptyRepositoryLabel} image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null}
                  {hasFiles ? (
                    <>
                      {activeFileReadOnlyNotice ? (
                        <Alert message={activeFileReadOnlyNotice} showIcon style={{ marginBottom: 8 }} type="info" />
                      ) : null}
                      <CodeTab
                        {...codeTabProps}
                        fullscreenControl={{
                          isFullscreen: fullscreen.isFullscreen,
                          toggleFullscreen: fullscreen.toggleFullscreen,
                        }}
                        toolbarActions={
                          moveToInline ? (
                            <Tooltip title={moveToInline.label}>
                              <Button
                                aria-label={moveToInline.label}
                                icon={<ImportOutlined />}
                                loading={moveToInline.loading}
                                onClick={moveToInline.onClick}
                                size="small"
                              />
                            </Tooltip>
                          ) : null
                        }
                      />
                    </>
                  ) : null}
                </main>
              </div>
              <div
                data-testid="light-extension-workspace-diagnostics"
                style={{
                  borderTop: `1px solid ${token.colorBorderSecondary}`,
                  flex: '0 0 auto',
                  maxHeight: fullscreen.isFullscreen ? '32%' : 160,
                  minHeight: 96,
                  overflowX: 'hidden',
                  overflowY: diagnostics.length > 0 ? 'auto' : 'hidden',
                  padding: 12,
                }}
              >
                <DiagnosticsPanel diagnostics={diagnostics} onOpenDiagnostic={onOpenDiagnostic} />
              </div>
            </div>,
            fullscreen.container,
          )
        : null}
    </>
  );
}
