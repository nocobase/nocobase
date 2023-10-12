import type { Page, Locator } from '@nocobase/test/client';

export class CreateWorkFlow {
  readonly page: Page;
  name: Locator;
  triggerType: Locator;
  description: Locator;
  autoDeleteHistory: Locator;

  constructor(page: Page) {
    this.page = page;
    this.name = page.getByTestId('title-item').getByRole('textbox');
    this.triggerType = page.getByTestId('type-item').getByLabel('Search');
    this.description = page.getByTestId('description-item').getByRole('textbox');
    this.autoDeleteHistory = page
      .getByTestId('deleteExecutionOnStatus-item')
      .getByTestId('antd-select')
      .locator('div')
      .nth(1);
  }
}

export class EditWorkFlow {
  readonly page: Page;
  name: Locator;
  statusIsOn: Locator;
  statusIisOff: Locator;
  description: Locator;
  autoDeleteHistory: Locator;

  constructor(page: Page) {
    this.page = page;
    this.name = page.getByTestId('title-item').getByRole('textbox');
    this.statusIsOn = page.getByTestId('enabled-item').getByLabel('On');
    this.statusIisOff = page.getByLabel('Off');
    this.description = page.getByTestId('description-item').getByRole('textbox');
    this.autoDeleteHistory = page
      .getByTestId('deleteExecutionOnStatus-item')
      .getByTestId('antd-select')
      .locator('div')
      .nth(1);
  }
}
