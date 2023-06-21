import { Plugin } from '../application-v2';
import { SigninPageExtensionProvider } from './SigninPageExtension';

export * from './OptionsComponent';
export * from './SigninPage';
export * from './SigninPageExtension';
export * from './SignupPage';

export class SigninPageExtensionPlugin extends Plugin {
  async load() {
    this.app.use(SigninPageExtensionProvider, this.options);
  }
}
