import React from 'react';
import { render, screen } from '@nocobase/test/client';
import {
  RecordProviderV2,
  RecordV2,
  useParentRecordDataV2,
  useParentRecordV2,
  useRecordDataV2,
  useRecordV2,
} from '../../record';

describe('RecordProvider', () => {
  describe('record and parentRecord', () => {
    test('record parameter is a `Record` instance', () => {
      const Demo = () => {
        const record = useRecordV2();
        return <pre data-testid="content">{JSON.stringify(record)}</pre>;
      };
      const record = new RecordV2({ data: { id: 1, name: 'foo' } });

      render(
        <RecordProviderV2 record={record}>
          <Demo />
        </RecordProviderV2>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent(JSON.stringify({ id: 1, name: 'foo' }));
    });

    test('record parameter is a `plain object`', () => {
      const Demo = () => {
        const record = useRecordV2();
        return <pre data-testid="content">{JSON.stringify(record)}</pre>;
      };

      render(
        <RecordProviderV2 record={{ id: 1, name: 'foo' }}>
          <Demo />
        </RecordProviderV2>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent(JSON.stringify({ id: 1, name: 'foo' }));
    });

    test('record parameter is a `Record` instance with parent record', () => {
      const Demo = () => {
        const record = useRecordV2();
        return <pre data-testid="content">{JSON.stringify(record)}</pre>;
      };

      const parentRecord = new RecordV2({ data: { id: 1, role: 'admin' } });
      const record = new RecordV2({ data: { id: 1, name: 'foo' }, parentRecord });

      render(
        <RecordProviderV2 record={record}>
          <Demo />
        </RecordProviderV2>,
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
        const record = useRecordV2();
        return <pre data-testid="content">{JSON.stringify(record)}</pre>;
      };

      const parentRecord = new RecordV2({ data: { id: 1, role: 'admin' } });
      const record = new RecordV2({ data: { id: 1, name: 'foo' } });

      render(
        <RecordProviderV2 record={record} parentRecord={parentRecord}>
          <Demo />
        </RecordProviderV2>,
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
        const record = useRecordV2();
        return <pre data-testid="content">{JSON.stringify(record)}</pre>;
      };

      render(
        <RecordProviderV2 record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }}>
          <Demo />
        </RecordProviderV2>,
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
    test('useRecordDataV2()', () => {
      const Demo = () => {
        const data = useRecordDataV2();
        return <pre data-testid="content">{JSON.stringify(data)}</pre>;
      };
      const parentRecord = new RecordV2({ data: { id: 1, role: 'admin' } });
      const record = new RecordV2({ data: { id: 1, name: 'foo' }, parentRecord });

      render(
        <RecordProviderV2 record={record}>
          <Demo />
        </RecordProviderV2>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent(JSON.stringify({ id: 1, name: 'foo' }));
    });

    test('useParentRecordV2()', () => {
      const Demo = () => {
        const data = useParentRecordV2();
        return <pre data-testid="content">{JSON.stringify(data)}</pre>;
      };
      const parentRecord = new RecordV2({ data: { id: 1, role: 'admin' } });
      const record = new RecordV2({ data: { id: 1, name: 'foo' }, parentRecord });

      render(
        <RecordProviderV2 record={record}>
          <Demo />
        </RecordProviderV2>,
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

    test('useParentRecordDataV2()', () => {
      const Demo = () => {
        const data = useParentRecordDataV2();
        return <pre data-testid="content">{JSON.stringify(data)}</pre>;
      };
      const parentRecord = new RecordV2({ data: { id: 1, role: 'admin' } });
      const record = new RecordV2({ data: { id: 1, name: 'foo' }, parentRecord });

      render(
        <RecordProviderV2 record={record}>
          <Demo />
        </RecordProviderV2>,
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
