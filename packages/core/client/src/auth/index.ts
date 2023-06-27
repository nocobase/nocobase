import { Plugin } from '../application-v2/Plugin';
import { SigninPageExtensionProvider } from './SigninPageExtension';

export * from './OptionsComponent';
export * from './SigninPage';
export * from './SigninPageExtension';
export * from './SignupPage';

export class SigninPageExtensionPlugin extends Plugin {
  static pluginName = 'signin-page-extension';

  async load() {
    this.app.use(SigninPageExtensionProvider, this.options);
  }
}
