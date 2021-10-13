import { Generator } from '@umijs/utils';
import { join } from 'path';

export default class AppGenerator extends Generator {
  private tplContext = {};

  setTplContext(context) {
    this.tplContext = context;
  }

  async writing() {
    this.copyDirectory({
      context: {
        version: require('../../package').version,
        conventionRoutes: this.args.conventionRoutes,
        ...this.tplContext
      },
      path: join(__dirname, '../../templates/AppGenerator'),
      target: this.cwd,
    });
  }
}
