export class ApplicationNotInstall extends Error {
  code: string;

  constructor(message) {
    super(message);

    this.code = 'APP_NOT_INSTALLED_ERROR';
  }
}
