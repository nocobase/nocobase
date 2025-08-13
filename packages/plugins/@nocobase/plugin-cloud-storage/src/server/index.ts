import { InstallOptions, Plugin } from '@nocobase/server';
import DropboxStorage from './storages/dropbox';
import GoogleDriveStorage from './storages/google-drive';
import OneDriveStorage from './storages/one-drive';
import BoxStorage from './storages/box';
import SharePointStorage from './storages/sharepoint';

export class CloudStorageServerPlugin extends Plugin {
  async install(options?: InstallOptions) {
    // register storage providers
    const fm = this.app.pm.get('file-manager');
    if (fm) {
      fm.storageManager.register(DropboxStorage.defaults().name, DropboxStorage);
      fm.storageManager.register(GoogleDriveStorage.defaults().name, GoogleDriveStorage);
      fm.storageManager.register(OneDriveStorage.defaults().name, OneDriveStorage);
      fm.storageManager.register(BoxStorage.defaults().name, BoxStorage);
      fm.storageManager.register(SharePointStorage.defaults().name, SharePointStorage);
    }
  }

  async load() {
    // anything need to be loaded when server starting
  }
}

export default CloudStorageServerPlugin;
