import AliOss from 'ali-oss';
import { getFilename } from '../utils';

export class AliOssStorage {

  private client: AliOss;

  private getFilename: Function;

  constructor(opts) {
    this.client = new AliOss(opts.config);
    this.getFilename = opts.filename || getFilename;
  }

  _handleFile(req, file, cb) {
    if (!this.client) {
      console.error('oss client undefined');
      return cb({message: 'oss client undefined'});
    }
    this.getFilename(req, file, (err, filename) => {
      if (err) return cb(err)
      this.client.putStream(filename, file.stream).then(
        result => cb(null, {
          filename: result.name,
          url     : result.url
        })
      ).catch(cb);
    });
  }

  _removeFile(req, file, cb) {
    if (!this.client) {
      console.error('oss client undefined');
      return cb({message: 'oss client undefined'});
    }
    this.client.delete(file.filename).then(
      result => cb(null, result)
    ).catch(cb);
  }
}

export default (storage) => new AliOssStorage({config: storage.options});
