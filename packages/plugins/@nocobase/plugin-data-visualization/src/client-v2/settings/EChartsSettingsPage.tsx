/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, ColorPicker, Divider, Flex, Form, InputNumber, Row, Select, Space, Typography } from 'antd';
import type { EChartsOption } from 'echarts';
import React, { useMemo, useState } from 'react';
import ECharts from '../flow/models/ECharts';
import { ECHARTS_THEME_OPTIONS } from '../flow/echarts/echartsThemes';
import { EChartsGlobalConfig, mergeOption, useEChartsGlobalConfig, useSetEChartsGlobalConfig } from '../hooks';
import { useT } from '../locale';

const DEFAULT_PALETTE = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'];

// 预览用的示例图表；真实业务图表的 option 会以同样方式与全局配置合并。
const SAMPLE_OPTION: EChartsOption = {
  tooltip: { trigger: 'axis' },
  legend: {},
  grid: { left: 40, right: 16, top: 32, bottom: 32, containLabel: true },
  xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  yAxis: { type: 'value' },
  series: [
    { name: 'Series A', type: 'bar', data: [120, 132, 101, 134, 90, 230, 210] },
    { name: 'Series B', type: 'line', data: [220, 182, 191, 234, 290, 330, 310] },
  ],
};

function readPalette(config: EChartsGlobalConfig): string[] {
  const color = config.option?.color;
  if (Array.isArray(color) && color.length) {
    return color.map((c) => String(c));
  }
  return DEFAULT_PALETTE;
}

/**
 * ECharts 全局配置 settings 页（挂在个人中心）。
 *
 * 用户在此选主题 / 编辑主色板 / 调文字样式，右侧实时预览，保存后通过
 * useSetEChartsGlobalConfig() 写入 localStorage（用户级个性化配置），
 * 全站 <ECharts> 立即套用。唯一失败场景是 localStorage 不可用（隐私模式 / 配额满），
 * 此时捕获后 message.error 提示即可。
 */
const EChartsSettingsPage: React.FC = () => {
  const t = useT();
  const { message } = App.useApp();
  const globalConfig = useEChartsGlobalConfig();
  const setGlobalConfig = useSetEChartsGlobalConfig();

  const [theme, setTheme] = useState<string>(globalConfig.theme ?? '');
  const [palette, setPalette] = useState<string[]>(() => readPalette(globalConfig));
  const [textColor, setTextColor] = useState<string | undefined>(
    (globalConfig.option?.textStyle as { color?: string } | undefined)?.color,
  );
  const [fontSize, setFontSize] = useState<number | undefined>(
    (globalConfig.option?.textStyle as { fontSize?: number } | undefined)?.fontSize,
  );

  const pendingConfig = useMemo<EChartsGlobalConfig>(() => {
    const option: EChartsOption = { color: palette };
    const textStyle: { color?: string; fontSize?: number } = {};
    if (textColor) {
      textStyle.color = textColor;
    }
    if (fontSize) {
      textStyle.fontSize = fontSize;
    }
    if (Object.keys(textStyle).length) {
      option.textStyle = textStyle;
    }
    return { theme: theme || undefined, option };
  }, [theme, palette, textColor, fontSize]);

  // 预览直接用待保存值，theme 走 prop（优先级最高），option 与示例合并（全局作底）
  const previewOption = useMemo(() => mergeOption(pendingConfig.option, SAMPLE_OPTION), [pendingConfig.option]);

  const updateColorAt = (index: number, hex: string) => {
    setPalette((prev) => prev.map((c, i) => (i === index ? hex : c)));
  };
  const addColor = () => setPalette((prev) => [...prev, '#3ba272']);
  const removeColor = (index: number) => setPalette((prev) => prev.filter((_, i) => i !== index));

  const handleSave = () => {
    try {
      setGlobalConfig(pendingConfig);
      message.success(t('Saved'));
    } catch {
      // localStorage 不可用时 saveStoredEChartsConfig 会抛错，明确告知未保存
      message.error(t('Save failed: cannot write to local storage'));
    }
  };

  const handleReset = () => {
    try {
      setGlobalConfig({});
      setTheme('');
      setPalette(DEFAULT_PALETTE);
      setTextColor(undefined);
      setFontSize(undefined);
      message.success(t('Reset to default'));
    } catch {
      message.error(t('Save failed: cannot write to local storage'));
    }
  };

  return (
    <Card>
      <Row gutter={24}>
        <Col xs={24} lg={10}>
          <Typography.Title level={5}>{t('ECharts global configuration')}</Typography.Title>
          <Typography.Paragraph type="secondary">
            {t('Set the theme, color palette and text style applied to all charts.')}
          </Typography.Paragraph>
          <Form layout="vertical">
            <Form.Item label={t('Theme')}>
              <Select
                value={theme}
                onChange={setTheme}
                options={ECHARTS_THEME_OPTIONS.map((o) => ({ value: o.value, label: t(o.label) }))}
                style={{ maxWidth: 280 }}
              />
            </Form.Item>

            <Form.Item label={t('Color palette')}>
              <Space wrap>
                {palette.map((color, index) => (
                  <Space.Compact key={index}>
                    <ColorPicker
                      value={color}
                      onChange={(_, hex) => updateColorAt(index, hex)}
                      showText
                    />
                    <Button
                      icon={<DeleteOutlined />}
                      aria-label={t('Remove color')}
                      disabled={palette.length <= 1}
                      onClick={() => removeColor(index)}
                    />
                  </Space.Compact>
                ))}
                <Button icon={<PlusOutlined />} onClick={addColor}>
                  {t('Add color')}
                </Button>
              </Space>
            </Form.Item>

            <Form.Item label={t('Text color')}>
              <ColorPicker
                value={textColor ?? null}
                onChange={(_, hex) => setTextColor(hex)}
                allowClear
                showText
                onClear={() => setTextColor(undefined)}
              />
            </Form.Item>

            <Form.Item label={t('Font size')}>
              <InputNumber
                value={fontSize}
                onChange={(v) => setFontSize(v ?? undefined)}
                min={8}
                max={40}
                addonAfter="px"
                placeholder={t('Default')}
              />
            </Form.Item>

            <Divider />
            <Space>
              <Button type="primary" onClick={handleSave}>
                {t('Save')}
              </Button>
              <Button onClick={handleReset}>{t('Reset to default')}</Button>
            </Space>
          </Form>
        </Col>

        <Col xs={24} lg={14}>
          <Typography.Title level={5}>{t('Live preview')}</Typography.Title>
          <Flex vertical style={{ height: 360 }}>
            <ECharts option={previewOption} theme={theme || undefined} fillHeight />
          </Flex>
        </Col>
      </Row>
    </Card>
  );
};

export default EChartsSettingsPage;
