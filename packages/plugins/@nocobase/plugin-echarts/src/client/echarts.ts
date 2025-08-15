import { Chart } from '@nocobase/plugin-data-visualization';
import { Bar } from './charts/Bar';

export default [
  new Chart({
    name: 'bar',
    title: 'Bar',
    Component: Bar,
  }),
];
