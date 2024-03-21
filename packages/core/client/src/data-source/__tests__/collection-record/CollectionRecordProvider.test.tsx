import React from 'react';
import { render, screen } from '@nocobase/test/client';
import {
  CollectionRecordProvider,
  CollectionRecord,
  useCollectionParentRecordData,
  useCollectionParentRecord,
  useCollectionRecordData,
  useCollectionRecord,
} from '../../collection-record';

describe('CollectionRecordProvider', () => {
  describe('record and parentRecord', () => {
    test('record parameter is a `Record` instance', () => {
      const Demo = () => {
        const record = useCollectionRecord();
        return <pre data-testid="content">{JSON.stringify(record)}</pre>;
      };
      const record = new CollectionRecord({ data: { id: 1, name: 'foo' } });

      render(
        <CollectionRecordProvider record={record}>
          <Demo />
        </CollectionRecordProvider>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent(JSON.stringify({ id: 1, name: 'foo' }));
    });

    test('record parameter is a `plain object`', () => {
      const Demo = () => {
        const record = useCollectionRecord();
        return <pre data-testid="content">{JSON.stringify(record)}</pre>;
      };

      render(
        <CollectionRecordProvider record={{ id: 1, name: 'foo' }}>
          <Demo />
        </CollectionRecordProvider>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent(JSON.stringify({ id: 1, name: 'foo' }));
    });

    test('record parameter is a `Record` instance with parent record', () => {
      const Demo = () => {
        const record = useCollectionRecord();
        return <pre data-testid="content">{JSON.stringify(record)}</pre>;
      };

      const parentRecord = new CollectionRecord({ data: { id: 1, role: 'admin' } });
      const record = new CollectionRecord({ data: { id: 1, name: 'foo' }, parentRecord });

      render(
        <CollectionRecordProvider record={record}>
          <Demo />
        </CollectionRecordProvider>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent(
        JSON.stringify({
          data: {
            id: 1,
            name: 'foo',
          },
          parentRecord: {
            data: {
              id: 1,
              role: 'admin',
            },
          },
        }),
      );
    });

    test('record parameter is a `Record` instance, parent record is passed through parentRecord parameter', () => {
      const Demo = () => {
        const record = useCollectionRecord();
        return <pre data-testid="content">{JSON.stringify(record)}</pre>;
      };

      const parentRecord = new CollectionRecord({ data: { id: 1, role: 'admin' } });
      const record = new CollectionRecord({ data: { id: 1, name: 'foo' } });

      render(
        <CollectionRecordProvider record={record} parentRecord={parentRecord}>
          <Demo />
        </CollectionRecordProvider>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent(
        JSON.stringify({
          data: {
            id: 1,
            name: 'foo',
          },
          parentRecord: {
            data: {
              id: 1,
              role: 'admin',
            },
          },
        }),
      );
    });

    test('record parameter is a `plain object`, parent record is also a `plain object`', () => {
      const Demo = () => {
        const record = useCollectionRecord();
        return <pre data-testid="content">{JSON.stringify(record)}</pre>;
      };

      render(
        <CollectionRecordProvider record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }}>
          <Demo />
        </CollectionRecordProvider>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent(
        JSON.stringify({
          data: {
            id: 1,
            name: 'foo',
          },
          parentRecord: {
            data: {
              id: 1,
              role: 'admin',
            },
          },
        }),
      );
    });
  });

  describe('hooks', () => {
    test('useCollectionRecordData()', () => {
      const Demo = () => {
        const data = useCollectionRecordData();
        return <pre data-testid="content">{JSON.stringify(data)}</pre>;
      };
      const parentRecord = new CollectionRecord({ data: { id: 1, role: 'admin' } });
      const record = new CollectionRecord({ data: { id: 1, name: 'foo' }, parentRecord });

      render(
        <CollectionRecordProvider record={record}>
          <Demo />
        </CollectionRecordProvider>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent(JSON.stringify({ id: 1, name: 'foo' }));
    });

    test('useCollectionParentRecord()', () => {
      const Demo = () => {
        const data = useCollectionParentRecord();
        return <pre data-testid="content">{JSON.stringify(data)}</pre>;
      };
      const parentRecord = new CollectionRecord({ data: { id: 1, role: 'admin' } });
      const record = new CollectionRecord({ data: { id: 1, name: 'foo' }, parentRecord });

      render(
        <CollectionRecordProvider record={record}>
          <Demo />
        </CollectionRecordProvider>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent(
        JSON.stringify({
          data: {
            id: 1,
            role: 'admin',
          },
        }),
      );
    });

    test('useCollectionParentRecordData()', () => {
      const Demo = () => {
        const data = useCollectionParentRecordData();
        return <pre data-testid="content">{JSON.stringify(data)}</pre>;
      };
      const parentRecord = new CollectionRecord({ data: { id: 1, role: 'admin' } });
      const record = new CollectionRecord({ data: { id: 1, name: 'foo' }, parentRecord });

      render(
        <CollectionRecordProvider record={record}>
          <Demo />
        </CollectionRecordProvider>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent(
        JSON.stringify({
          id: 1,
          role: 'admin',
        }),
      );
    });
  });
});
