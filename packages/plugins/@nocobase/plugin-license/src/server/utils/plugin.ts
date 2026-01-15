/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import sortBy from 'lodash/sortBy';
import { isDateExpired } from './key';
import { KeyData } from './interface';

export interface PluginData {
  name: string;
  packageName: string;
  status: string;
  expirationDate: string;
  enabled: boolean;
  installed: boolean;
}

export async function getPlugins({ keyData, ctx }: { keyData: KeyData; ctx: any }) {
  const locale = ctx.getCurrentLocale();
  // 获取所有已安装的插件
  const plugin = ctx.app.pm.get('nocobase') as any;
  const localPlugins = await plugin.getAllPlugins(locale);
  // 获取已启用的插件实例
  const currentPluginInstances = [];
  for (const [_, p] of ctx.app.pm.getPlugins()) {
    currentPluginInstances.push({
      name: p.options.name,
      __isCommercial: p.options.__isCommercial,
      packageName: p.options.packageName,
      enabled: p.options.enabled,
    });
  }
  // key的商业插件清单
  const licensedPlugins = keyData?.plugins || [];
  // 所有的商业插件，包含key中清单和本地 __isCommercial 标志的清单
  const allCommericalPluginNames = [...licensedPlugins.map((p) => p.packageName)];
  localPlugins.forEach((p) => {
    const instance = currentPluginInstances?.find((plugin) => plugin.packageName === p.packageName);
    if (instance?.__isCommercial) {
      allCommericalPluginNames.push(p.packageName);
    }
  });
  // 已安装的商业插件，后续校验
  const installedCommericalPlugins = [];
  for (const plugin of localPlugins) {
    if (allCommericalPluginNames.includes(plugin.packageName)) {
      installedCommericalPlugins.push(plugin.packageName);
    }
  }
  const plugins: PluginData[] = [];
  for (const name of installedCommericalPlugins) {
    let status = 'unlicensed';
    const expirationDate = licensedPlugins?.find((p) => p.packageName === name)?.updateExpirationDate;
    if (expirationDate) {
      const isExpired = isDateExpired(expirationDate);
      if (isExpired) {
        status = 'expired';
      } else {
        status = 'licensed';
      }
    }
    const plugin = localPlugins.find((p) => p.packageName === name);
    plugins.push({
      name: plugin?.displayName || plugin?.name || name,
      packageName: name,
      status,
      expirationDate,
      enabled: plugin?.enabled,
      installed: true,
    });
  }
  const statusOrder = {
    unlicensed: 0,
    trial: 1,
    expired: 2,
    suspended: 3,
    revoked: 4,
    invalid: 5,
    pending: 6,
    licensed: 7,
  };
  const list = sortBy(plugins, (plugin) => [statusOrder[plugin.status] ?? 999, plugin.enabled ? 0 : 1, plugin.name]);
  licensedPlugins.forEach((p) => {
    const plugin = plugins.find((plugin) => plugin.packageName === p.packageName);
    if (p.updateExpirationDate && !plugin) {
      const isExpired = isDateExpired(p.updateExpirationDate);
      list.push({
        name: p.displayName || p.packageName,
        packageName: p.packageName,
        status: isExpired ? 'expired' : 'licensed',
        expirationDate: p.updateExpirationDate,
        enabled: false,
        installed: false,
      });
    }
  });
  return list;
}

export function getPluginsLicenseStatus({ plugins }: { plugins: PluginData[] }) {
  return plugins.filter((p) => p.status === 'unlicensed').length === 0;
}
