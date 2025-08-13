import { StorageType, AttachmentModel } from '@nocobase/plugin-file-manager';

const STORAGE_TYPE_SHAREPOINT = 'sharepoint';

export default class extends StorageType {
  static defaults() {
    return {
      title: 'SharePoint',
      name: 'sharepoint',
      type: STORAGE_TYPE_SHAREPOINT,
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
