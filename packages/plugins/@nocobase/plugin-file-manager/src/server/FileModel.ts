import { Model } from '@nocobase/database';

export class FileModel extends Model {
  public toJSON() {
    const json = super.toJSON();
    const fileStorages = this.constructor['database']?.['_fileStorages'];
    if (json.storageId && fileStorages && fileStorages.has(json.storageId)) {
      const storage = fileStorages.get(json.storageId);
      json['thumbnailRule'] = storage?.options?.thumbnailRule;
    }
    console.log(json, fileStorages);
    return json;
  }
}
