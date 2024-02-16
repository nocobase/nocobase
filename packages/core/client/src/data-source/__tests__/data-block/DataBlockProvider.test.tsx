import React from 'react';
import { fireEvent, render, screen, waitFor } from '@nocobase/test/client';
import CollectionTableListDemo from './data-block-demos/collection-table-list';
import CollectionFormGetAndUpdateDemo from './data-block-demos/collection-form-get-and-update';
import CollectionFormCreateDemo from './data-block-demos/collection-form-create';
import CollectionFormRecordAndUpdateDemo from './data-block-demos/collection-form-record-and-update';
import AssociationTableListAndSourceIdDemo from './data-block-demos/association-table-list-and-source-id';
import AssociationTableListAndParentRecordDemo from './data-block-demos/association-table-list-and-parent-record';

describe('CollectionDataSourceProvider', () => {
  describe('collection', () => {
    test('Table list', async () => {
      const { getByText, getByRole } = render(<CollectionTableListDemo />);

      // app loading
      await waitFor(() => {
        expect(getByRole('table')).toBeInTheDocument();
      });

      expect(getByText('UserName')).toBeInTheDocument();
      expect(getByText('NickName')).toBeInTheDocument();
      expect(getByText('Email')).toBeInTheDocument();

      // loading table data
      await waitFor(() => {
        const columns = screen.getByRole('table').querySelectorAll('tbody tr');
        expect(columns.length).toBe(3);
      });

      expect(getByText('jack')).toBeInTheDocument();
      expect(getByText('Jack Ma')).toBeInTheDocument();
      expect(getByText('test@gmail.com')).toBeInTheDocument();
    });

    test('Form get & update', async () => {
      render(<CollectionFormGetAndUpdateDemo />);

      await waitFor(() => {
        expect(screen.getByText('Username')).toBeInTheDocument();
        expect(screen.getByText('Age')).toBeInTheDocument();
      });

      // load form data success
      await waitFor(() => {
        expect(document.getElementById('username')).toHaveValue('Bamboo');
        expect(document.getElementById('age')).toHaveValue('18');
      });

      fireEvent.click(document.querySelector('button'));

      await waitFor(() => {
        expect(screen.getByText('Save successfully!')).toBeInTheDocument();
      });
    });

    test('Form create', async () => {
      render(<CollectionFormCreateDemo />);

      await waitFor(() => {
        expect(screen.getByText('Username')).toBeInTheDocument();
        expect(screen.getByText('Age')).toBeInTheDocument();
      });

      fireEvent.change(document.getElementById('username'), { target: { value: 'Bamboo' } });
      fireEvent.change(document.getElementById('age'), { target: { value: '18' } });

      fireEvent.click(document.querySelector('button'));

      await waitFor(() => {
        expect(screen.getByText('Save successfully!')).toBeInTheDocument();
      });
    });

    test('Form record & update', async () => {
      render(<CollectionFormRecordAndUpdateDemo />);

      await waitFor(() => {
        expect(screen.getByText('Username')).toBeInTheDocument();
        expect(screen.getByText('Age')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(document.getElementById('username')).toHaveValue('Bamboo');
        expect(document.getElementById('age')).toHaveValue('18');
      });

      fireEvent.click(document.querySelector('button'));

      await waitFor(() => {
        expect(screen.getByText('Save successfully!')).toBeInTheDocument();
      });
    });
  });

  describe('association', () => {
    test('Table list & sourceId', async () => {
      const { getByText, getByRole } = render(<AssociationTableListAndSourceIdDemo />);

      // app loading
      await waitFor(() => {
        expect(getByRole('table')).toBeInTheDocument();
      });

      expect(getByText('Name')).toBeInTheDocument();
      expect(getByText('Title')).toBeInTheDocument();
      expect(getByText('Description')).toBeInTheDocument();

      // loading table data
      await waitFor(() => {
        const columns = screen.getByRole('table').querySelectorAll('tbody tr');
        expect(columns.length).toBe(2);
      });

      expect(getByText('admin')).toBeInTheDocument();
      expect(getByText('Admin')).toBeInTheDocument();
      expect(getByText('Admin description')).toBeInTheDocument();
    });
    test('Table list & parentRecord', async () => {
      const { getByText, getByRole } = render(<AssociationTableListAndParentRecordDemo />);

      // app loading
      await waitFor(() => {
        expect(getByRole('table')).toBeInTheDocument();
      });

      expect(getByText('Name')).toBeInTheDocument();
      expect(getByText('Title')).toBeInTheDocument();
      expect(getByText('Description')).toBeInTheDocument();

      // loading table data
      await waitFor(() => {
        const columns = screen.getByRole('table').querySelectorAll('tbody tr');
        expect(columns.length).toBe(2);
      });

      expect(getByText('admin')).toBeInTheDocument();
      expect(getByText('Admin')).toBeInTheDocument();
      expect(getByText('Admin description')).toBeInTheDocument();
    });
  });
});
