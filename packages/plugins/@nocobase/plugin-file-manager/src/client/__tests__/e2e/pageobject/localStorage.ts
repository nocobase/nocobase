import type { Page, Locator } from '@nocobase/test/client';

export class CreateLocalStorage {
  readonly page: Page;
  title: Locator;
  storageName: Locator;
  storagebaseURL: Locator;
  storageType: Locator;
  destination: Locator;
  path: Locator;
  defaultStorage: Locator;
  deleteRecordRetentionFile: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId('title-item').getByRole('textbox');
    this.storageName = page.getByTestId('name-item').getByRole('textbox');
    this.storagebaseURL = page.getByTestId('baseUrl-item').getByRole('textbox');
    this.storageType = page.getByTestId('type-item').getByLabel('Search');
    this.destination = page.getByTestId('documentRoot-item').getByRole('textbox');
    this.path = page.getByTestId('path-item').getByRole('textbox');
    this.defaultStorage = page.getByLabel('Default storage');
    this.deleteRecordRetentionFile = page.getByLabel('Keep file in storage when destroy record');
  }
}

export class EditLocalStorage {
  readonly page: Page;
  title: Locator;
  storageName: Locator;
  storagebaseURL: Locator;
  storageType: Locator;
  destination: Locator;
  path: Locator;
  defaultStorage: Locator;
  deleteRecordRetentionFile: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId('title-item').getByRole('textbox');
    this.storageName = page.getByTestId('name-item').getByRole('textbox');
    this.storagebaseURL = page.getByTestId('baseUrl-item').getByRole('textbox');
    this.storageType = page.getByTestId('type-item').getByLabel('Search');
    this.destination = page.getByTestId('documentRoot-item').getByRole('textbox');
    this.path = page.getByTestId('path-item').getByRole('textbox');
    this.defaultStorage = page.getByLabel('Default storage');
    this.deleteRecordRetentionFile = page.getByLabel('Keep file in storage when destroy record');
  }
}
