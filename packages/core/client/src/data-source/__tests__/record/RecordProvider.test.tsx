import React from 'react';
import { render, screen } from '@nocobase/test/client';
import { RecordProvider, Record, useParentRecordData, useParentRecord, useRecordData, useRecord } from '../../record';

describe('RecordProvider', () => {
  describe('record and parentRecord', () => {
    test('record parameter is a `Record` instance', () => {
      const Demo = () => {
        const record = useRecord();
        return <pre data-testid="content">{JSON.stringify(record)}</pre>;
      };
      const record = new Record({ data: { id: 1, name: 'foo' } });

      render(
        <RecordProvider record={record}>
          <Demo />
        </RecordProvider>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent(JSON.stringify({ id: 1, name: 'foo' }));
    });

    test('record parameter is a `plain object`', () => {
      const Demo = () => {
        const record = useRecord();
        return <pre data-testid="content">{JSON.stringify(record)}</pre>;
      };

      render(
        <RecordProvider record={{ id: 1, name: 'foo' }}>
          <Demo />
        </RecordProvider>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent(JSON.stringify({ id: 1, name: 'foo' }));
    });

    test('record parameter is a `Record` instance with parent record', () => {
      const Demo = () => {
        const record = useRecord();
        return <pre data-testid="content">{JSON.stringify(record)}</pre>;
      };

      const parentRecord = new Record({ data: { id: 1, role: 'admin' } });
      const record = new Record({ data: { id: 1, name: 'foo' }, parentRecord });

      render(
        <RecordProvider record={record}>
          <Demo />
        </RecordProvider>,
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
        const record = useRecord();
        return <pre data-testid="content">{JSON.stringify(record)}</pre>;
      };

      const parentRecord = new Record({ data: { id: 1, role: 'admin' } });
      const record = new Record({ data: { id: 1, name: 'foo' } });

      render(
        <RecordProvider record={record} parentRecord={parentRecord}>
          <Demo />
        </RecordProvider>,
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
        const record = useRecord();
        return <pre data-testid="content">{JSON.stringify(record)}</pre>;
      };

      render(
        <RecordProvider record={{ id: 1, name: 'foo' }} parentRecord={{ id: 1, role: 'admin' }}>
          <Demo />
        </RecordProvider>,
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
    test('useRecordData()', () => {
      const Demo = () => {
        const data = useRecordData();
        return <pre data-testid="content">{JSON.stringify(data)}</pre>;
      };
      const parentRecord = new Record({ data: { id: 1, role: 'admin' } });
      const record = new Record({ data: { id: 1, name: 'foo' }, parentRecord });

      render(
        <RecordProvider record={record}>
          <Demo />
        </RecordProvider>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent(JSON.stringify({ id: 1, name: 'foo' }));
    });

    test('useParentRecord()', () => {
      const Demo = () => {
        const data = useParentRecord();
        return <pre data-testid="content">{JSON.stringify(data)}</pre>;
      };
      const parentRecord = new Record({ data: { id: 1, role: 'admin' } });
      const record = new Record({ data: { id: 1, name: 'foo' }, parentRecord });

      render(
        <RecordProvider record={record}>
          <Demo />
        </RecordProvider>,
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

    test('useParentRecordData()', () => {
      const Demo = () => {
        const data = useParentRecordData();
        return <pre data-testid="content">{JSON.stringify(data)}</pre>;
      };
      const parentRecord = new Record({ data: { id: 1, role: 'admin' } });
      const record = new Record({ data: { id: 1, name: 'foo' }, parentRecord });

      render(
        <RecordProvider record={record}>
          <Demo />
        </RecordProvider>,
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
