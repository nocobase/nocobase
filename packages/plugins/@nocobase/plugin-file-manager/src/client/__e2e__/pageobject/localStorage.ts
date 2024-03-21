import type { Locator, Page } from '@nocobase/test/e2e';

export class CreateLocalStorage {
  readonly page: Page;
  title: Locator;
  storageName: Locator;
  storagebaseURL: Locator;
  destination: Locator;
  path: Locator;
  defaultStorage: Locator;
  deleteRecordRetentionFile: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByLabel('block-item-CollectionField-storages-Title').getByRole('textbox');
    this.storageName = page.getByLabel('block-item-CollectionField-storages-Storage name').getByRole('textbox');
    // this.storagebaseURL = page.getByLabel('block-item-CollectionField-storages-Storage base URL').getByRole('textbox');
    // this.destination = page.getByLabel('block-item-Input-storages-Destination').getByRole('textbox');
    this.path = page.getByLabel('block-item-CollectionField-storages-Path').getByRole('textbox');
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
    this.title = page.getByLabel('block-item-CollectionField-storages-Title').getByRole('textbox');
    this.storageName = page.getByLabel('block-item-CollectionField-storages-Storage name').getByRole('textbox');
    // this.storagebaseURL = page.getByLabel('block-item-CollectionField-storages-Storage base URL').getByRole('textbox');
    // this.destination = page.getByLabel('block-item-Input-storages-Destination').getByRole('textbox');
    this.path = page.getByLabel('block-item-CollectionField-storages-Path').getByRole('textbox');
    this.defaultStorage = page.getByLabel('Default storage');
    this.deleteRecordRetentionFile = page.getByLabel('Keep file in storage when destroy record');
  }
}
