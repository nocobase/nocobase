import { Plugin } from '@nocobase/server';
import commentCfg from './collections/comment';

export class CommentPlugin extends Plugin {
  beforeLoad() {
  }

  async load() {
    const comment = this.db.collection(commentCfg);
    await comment.sync();
    // console.log('has',this.db.hasCollection('comment'));
    // const existed = await comment.existsInDb();

    // console.log('hasDb',existed); // false
    this.app.acl.allow('comment', '*');
  }
}

export default CommentPlugin;
