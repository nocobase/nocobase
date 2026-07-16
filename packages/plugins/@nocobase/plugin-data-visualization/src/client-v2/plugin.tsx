/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';

import { ChartGroup } from './chart';
import { EChartsConfigProvider } from './hooks';
import { translateExpr } from './locale';

type FieldInterfaceConfig = {
  valueFormatter: (field: any, value: any, context?: any) => any;
};

const valueFormatter: FieldInterfaceConfig['valueFormatter'] = (field, value, context) => {
  const options = field?.uiSchema?.enum || field?.options?.uiSchema?.enum;
  const parseEnumValues = (options: { label: string; value: string }[], value: any) => {
    if (Array.isArray(value)) {
      return value.map((v) => parseEnumValues(options, v));
    }
    const option = options.find((option) => option.value === (value?.toString?.() || value));
    return translateExpr(option?.label || value, context?.t || ((key: string) => key));
  };
  if (!options || !Array.isArray(options)) {
    return value;
  }
  return parseEnumValues(options, value);
};

export class PluginDataVisualizationClient extends Plugin {
  public charts = new ChartGroup();

  fieldInterfaceConfigs: {
    [fieldInterface: string]: FieldInterfaceConfig;
  } = {
    select: { valueFormatter },
    multipleSelect: { valueFormatter },
    radioGroup: { valueFormatter },
    checkboxGroup: { valueFormatter },
  };

  registerFieldInterfaceConfig(key: string, config: FieldInterfaceConfig) {
    this.fieldInterfaceConfigs[key] = config;
  }

  async load() {
    this.flowEngine.registerModelLoaders({
      ChartBlockModel: {
        loader: () => import('./flow/models/ChartBlockModel'),
      },
    });

    // 应用根部挂一次全局 ECharts 配置 Provider（配置从 localStorage 读取，
    // 这是用户级个性化配置，非平台级 admin 设置）。全站 <ECharts> 自动套用，
    // settings 页（挂在个人中心）通过 useSetEChartsGlobalConfig() 写入并即时刷新。
    this.app.use(EChartsConfigProvider);
  }
}

export { PluginDataVisualizationClient as PluginDataVisualiztionClient };

export default PluginDataVisualizationClient;
