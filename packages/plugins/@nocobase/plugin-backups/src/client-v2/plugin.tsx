/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import { Plugin } from '@nocobase/client-v2';
import { BACKUP_RESTORE_RUNTIME_KEY, BackupRestoreRuntime, NAMESPACE } from './constants';

type BackupRuntimeApp = Application & {
  error: unknown;
  maintaining: boolean;
  setMaintaining?: (maintaining: boolean) => void;
};

export class PluginBackupsClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    const title = this.t('Backup manager') as unknown as string;

    this.flowEngine.context.defineProperty(BACKUP_RESTORE_RUNTIME_KEY, {
      value: this.createBackupRestoreRuntime(),
    });

    this.pluginSettingsManager.addMenuItem({
      key: NAMESPACE,
      title,
      icon: 'CloudServerOutlined',
      showTabs: true,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'list',
      title: this.t('Backup list') as unknown as string,
      icon: 'CloudServerOutlined',
      aclSnippet: `pm.${NAMESPACE}`,
      componentLoader: () => import('./pages/BackupsManagement'),
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'settings',
      title: this.t('Settings') as unknown as string,
      icon: 'SettingOutlined',
      aclSnippet: `pm.${NAMESPACE}.settings`,
      componentLoader: () => import('./pages/BackupSettings'),
    });
  }

  private createBackupRestoreRuntime(): BackupRestoreRuntime {
    const app = this.app as BackupRuntimeApp;

    return {
      showCheckBackupMessage: () => {
        if (typeof app.setMaintaining === 'function') {
          app.setMaintaining(true);
        } else {
          app.maintaining = true;
        }
        app.error = {
          command: {
            name: 'APP Restoring',
          },
          message: 'checking backup...',
          code: 'APP_COMMANDING',
        };
      },
      hideCheckBackupMessage: () => {
        if (typeof app.setMaintaining === 'function') {
          app.setMaintaining(false);
        } else {
          app.maintaining = false;
        }
      },
    };
  }
}

export default PluginBackupsClientV2;
