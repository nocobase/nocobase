/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Bar } from './bar';
import { Column } from './column';
import { EChart } from './echart';
import { Funnel } from './funnel';
import { Line } from './line';
import { Pie } from './pie';
import { Radar } from './radar';
import { WordCloud } from './wordcloud';
import chalk from './themes/dark/chalk';
import dark from './themes/dark/dark';
import halloween from './themes/dark/halloween';
import purplePassion from './themes/dark/purple-passion';
import essos from './themes/light/essos';
import infographic from './themes/light/infographic';
import macarons from './themes/light/macarons';
import roma from './themes/light/roma';
import shine from './themes/light/shine';
import vintage from './themes/light/vintage';
import walden from './themes/light/walden';
import westeros from './themes/light/westeros';
import wonderland from './themes/light/wonderland';
import { Treemap } from './treemap';
import { DivergingBar } from './diverging-bar';
import { lang } from '../locale';

EChart.registerTheme('walden', walden);
EChart.registerTheme('vintage', vintage);
EChart.registerTheme('westeros', westeros);
EChart.registerTheme('essos', essos);
EChart.registerTheme('infographic', infographic);
EChart.registerTheme('macarons', macarons);
EChart.registerTheme('roma', roma);
EChart.registerTheme('shine', shine);
EChart.registerTheme('wonderland', wonderland);
EChart.registerTheme('defaultDark', dark, 'dark');
EChart.registerTheme('chalk', chalk, 'dark');
EChart.registerTheme('halloween', halloween, 'dark');
EChart.registerTheme('purple-passion', purplePassion, 'dark');

export default [
  new Line(),
  new Column(),
  new Bar(),
  new DivergingBar(),
  new Pie(),
  new EChart({
    name: 'area',
    title: lang('Area'),
    series: { type: 'line', areaStyle: {} },
    config: ['smooth', 'isStack'],
  }),
  new EChart({
    name: 'scatter',
    title: lang('Scatter'),
    series: { type: 'scatter' },
  }),
  new Funnel(),
  new Radar(),
  new Treemap(),
  new WordCloud(),
];
export { EChart };
