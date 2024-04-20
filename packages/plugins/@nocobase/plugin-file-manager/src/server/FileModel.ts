import { Model } from '@nocobase/database';

export class FileModel extends Model {
  public toJSON() {
    const json = super.toJSON();
    const fileStorages = this.constructor['database']?.['_fileStorages'];
    if (json.storageId && fileStorages && fileStorages.has(json.storageId)) {
      const storage = fileStorages.get(json.storageId);
      if (storage?.type === 'local' && process.env.APP_PUBLIC_PATH) {
        json['url'] = process.env.APP_PUBLIC_PATH.replace(/\/$/g, '') + json.url;
      }
    }
    return json;
  }
}
