import { StorageType, AttachmentModel } from '@nocobase/plugin-file-manager';

const STORAGE_TYPE_ONEDRIVE = 'onedrive';

export default class extends StorageType {
  static defaults() {
    return {
      title: 'OneDrive',
      name: 'onedrive',
      type: STORAGE_TYPE_ONEDRIVE,
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
