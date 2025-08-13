import { StorageType, AttachmentModel } from '@nocobase/plugin-file-manager';

const STORAGE_TYPE_BOX = 'box';

export default class extends StorageType {
  static defaults() {
    return {
      title: 'Box',
      name: 'box',
      type: STORAGE_TYPE_BOX,
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
