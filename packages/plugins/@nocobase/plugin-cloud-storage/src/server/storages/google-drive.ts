import { StorageType, AttachmentModel } from '@nocobase/plugin-file-manager';

const STORAGE_TYPE_GOOGLE_DRIVE = 'google-drive';

export default class extends StorageType {
  static defaults() {
    return {
      title: 'Google Drive',
      name: 'google-drive',
      type: STORAGE_TYPE_GOOGLE_DRIVE,
      options: {},
    };
  }

  make() {
    // TODO: implement
    return null;
  }

  async delete(records: AttachmentModel[]): Promise<[number, AttachmentModel[]]> {
    // TODO: implement
    return [0, records];
  }
}
