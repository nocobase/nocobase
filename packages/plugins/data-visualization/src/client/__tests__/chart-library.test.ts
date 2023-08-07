import { Chart } from '../chart/chart';
import { FieldOption } from '../hooks';
const chart = new Chart('test', 'Test', null);

describe('library', () => {
  describe('auto infer', () => {
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
