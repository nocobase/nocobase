import { FieldOption } from '../hooks';
import { infer } from '../renderer';

describe('library', () => {
  describe('auto infer', () => {
    const fields = [
      {
        name: 'price',
        type: 'number',
        label: 'Price',
      },
      {
        name: 'count',
        type: 'number',
        label: 'Count',
      },
      {
        name: 'title',
        type: 'string',
        label: 'Title',
      },
      {
        name: 'name',
        type: 'string',
        label: 'Name',
      },
      {
        name: 'createdAt',
        type: 'date',
        label: 'Created At',
      },
    ] as FieldOption[];

    test('1 measure, 1 dimension', () => {
      const { xField, yField } = infer(fields, {
        measures: [{ field: 'price' }],
        dimensions: [{ field: 'title' }],
      });
      expect(yField.label).toEqual('Price');
      expect(xField.label).toEqual('Title');
    });

    test('1 measure, 2 dimensions with date', () => {
      const { xField, yField, seriesField } = infer(fields, {
        measures: [{ field: 'price' }],
        dimensions: [{ field: 'title' }, { field: 'createdAt' }],
      });
      expect(yField.label).toEqual('Price');
      expect(xField.label).toEqual('Created At');
      expect(seriesField.label).toEqual('Title');
    });

    test('1 measure, 2 dimensions without date', () => {
      const { xField, yField, seriesField } = infer(fields, {
        measures: [{ field: 'price' }],
        dimensions: [{ field: 'title' }, { field: 'name' }],
      });
      expect(yField.label).toEqual('Price');
      expect(xField.label).toEqual('Title');
      expect(seriesField.label).toEqual('Name');
    });

    test('2 measures, 1 dimension', () => {
      const { xField, yField, yFields } = infer(fields, {
        measures: [{ field: 'price' }, { field: 'count' }],
        dimensions: [{ field: 'title' }],
      });
      expect(yField.label).toEqual('Price');
      expect(xField.label).toEqual('Title');
      expect(yFields.length).toEqual(2);
    });
  });
});
