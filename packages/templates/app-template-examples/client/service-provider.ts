import {
  ClientApplication,
  mountInstallLinks,
  toasterToken,
} from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import { createToaster } from './lib/toaster.js';

export class DefaultClientServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-template-examples/client';
  private previousDocumentTitle: string | undefined;
  private unmountInstallLinks: (() => void) | undefined;

  public override register(): void {
    // What plugins and pages report through useToaster() reaches the Toaster in client/react-providers.ts from here.
    this.app.container.instance(toasterToken, createToaster());
  }

  public override boot(): Promise<void> {
    const configuredTitle = this.app.config.get<unknown>('app.title');
    const title =
      typeof configuredTitle === 'string' && configuredTitle.trim()
        ? configuredTitle.trim()
        : 'NocoBase';
    this.previousDocumentTitle = document.title;
    document.title = title;
    // Lets browsers offer installation; turned off with pwa.enabled on the server. Asks for no permission.
    if (this.app.config.public.get('pwa.enabled', false)) {
      this.unmountInstallLinks?.();
      this.unmountInstallLinks = mountInstallLinks({
        basePath: this.app.config.get<string>('app.basePath'),
        appleTouchIcon: this.app.config.public.get('pwa.appleTouchIcon'),
      });
    }
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    this.unmountInstallLinks?.();
    this.unmountInstallLinks = undefined;
    if (this.previousDocumentTitle !== undefined) {
      document.title = this.previousDocumentTitle;
    }
    return Promise.resolve();
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  DefaultClientServiceProvider,
];

export default serviceProviders;
