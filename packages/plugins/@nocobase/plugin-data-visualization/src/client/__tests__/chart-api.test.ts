import DataVisualizationPlugin from '..';
import { Chart } from '../chart/chart';
import { ChartGroup } from '../chart/group';
import { FieldOption } from '../hooks';

describe('api', () => {
  describe('group', () => {
    const plugin = new DataVisualizationPlugin({}, null);
    afterEach(() => {
      plugin.charts = new ChartGroup();
    });

    test('setGroup', () => {
      const charts1 = [new Chart({ name: 'test1', title: 'Test1', Component: null })];
      plugin.charts.setGroup('group', charts1);
      expect(plugin.charts.charts.get('group')).toEqual(charts1);

      const charts2 = [new Chart({ name: 'test2', title: 'Test2', Component: null })];
      plugin.charts.setGroup('group', charts2);
      expect(plugin.charts.charts.get('group')).toEqual(charts2);
    });

    test('addGroup', () => {
      const charts1 = [new Chart({ name: 'test1', title: 'Test1', Component: null })];
      plugin.charts.setGroup('group1', charts1);
      const charts2 = [new Chart({ name: 'test2', title: 'Test2', Component: null })];
      plugin.charts.addGroup('group2', charts2);
      expect(plugin.charts.charts.get('group1')).toEqual(charts1);
      expect(plugin.charts.charts.get('group2')).toEqual(charts2);
    });

    test('add', () => {
      const charts1 = [new Chart({ name: 'test1', title: 'Test1', Component: null })];
      plugin.charts.setGroup('group', charts1);

      const chart = new Chart({ name: 'test2', title: 'Test2', Component: null });
      plugin.charts.add('group', chart);
      expect(plugin.charts.charts.get('group').length).toEqual(2);
      expect(plugin.charts.charts.get('group')[1].name).toEqual('test2');
    });

    test('getChartTypes', () => {
      const charts1 = [new Chart({ name: 'test1', title: 'Test1', Component: null })];
      plugin.charts.setGroup('group1', charts1);
      const charts2 = [new Chart({ name: 'test2', title: 'Test2', Component: null })];
      plugin.charts.setGroup('group2', charts2);
      expect(plugin.charts.getChartTypes()).toEqual([
        {
          label: 'group1',
          children: [
            {
              key: 'group1.test1',
              label: 'Test1',
              value: 'group1.test1',
            },
          ],
        },
        {
          label: 'group2',
          children: [
            {
              key: 'group2.test2',
              label: 'Test2',
              value: 'group2.test2',
            },
          ],
        },
      ]);
    });

    test('getCharts', () => {
      const charts1 = [new Chart({ name: 'test1', title: 'Test1', Component: null })];
      plugin.charts.setGroup('group1', charts1);
      const charts2 = [new Chart({ name: 'test2', title: 'Test2', Component: null })];
      plugin.charts.setGroup('group2', charts2);
      expect(plugin.charts.getCharts()).toEqual({
        'group1.test1': charts1[0],
        'group2.test2': charts2[0],
      });
    });

    test('getChart', () => {
      const charts1 = [new Chart({ name: 'test1', title: 'Test1', Component: null })];
      plugin.charts.setGroup('group1', charts1);
      const charts2 = [new Chart({ name: 'test2', title: 'Test2', Component: null })];
      plugin.charts.setGroup('group2', charts2);
      expect(plugin.charts.getChart('group1.test1')).toEqual(charts1[0]);
      expect(plugin.charts.getChart('group2.test2')).toEqual(charts2[0]);
    });
  });

  describe('auto infer', () => {
    const chart = new Chart({ name: 'test', title: 'Test', Component: null });
    const fields = [
      {
        name: 'price',
        value: 'price',
        type: 'number',
        label: 'Price',
      },
      {
        name: 'count',
        value: 'count',
        type: 'number',
        label: 'Count',
      },
      {
        name: 'title',
        value: 'title',
        type: 'string',
        label: 'Title',
      },
      {
        name: 'name',
        value: 'name',
        type: 'string',
        label: 'Name',
      },
      {
        name: 'createdAt',
        value: 'createdAt',
        type: 'date',
        label: 'Created At',
      },
    ] as FieldOption[];

    test('1 measure, 1 dimension', () => {
      const { xField, yField } = chart.infer(fields, {
        measures: [{ field: ['price'] }],
        dimensions: [{ field: ['title'] }],
      });
      expect(yField.value).toEqual('price');
      expect(xField.value).toEqual('title');
    });

    test('1 measure, 2 dimensions with date', () => {
      const { xField, yField, seriesField } = chart.infer(fields, {
        measures: [{ field: ['price'] }],
        dimensions: [{ field: ['title'] }, { field: ['createdAt'] }],
      });
      expect(yField.value).toEqual('price');
      expect(xField.value).toEqual('createdAt');
      expect(seriesField.value).toEqual('title');
    });

    test('1 measure, 2 dimensions without date', () => {
      const { xField, yField, seriesField } = chart.infer(fields, {
        measures: [{ field: ['price'] }],
        dimensions: [{ field: ['title'] }, { field: ['name'] }],
      });
      expect(yField.value).toEqual('price');
      expect(xField.value).toEqual('title');
      expect(seriesField.value).toEqual('name');
    });

    test('2 measures, 1 dimension', () => {
      const { xField, yField, yFields } = chart.infer(fields, {
        measures: [{ field: ['price'] }, { field: ['count'] }],
        dimensions: [{ field: ['title'] }],
      });
      expect(yField.value).toEqual('price');
      expect(xField.value).toEqual('title');
      expect(yFields.length).toEqual(2);
    });
  });
});
