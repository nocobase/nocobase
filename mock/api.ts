import Mock from 'mockjs';
import * as resources from './resources';

export default {
  '/api/:resource::action': (req: any, res: any) => {
    const action = resources[req.params.resource][req.params.action];
    if (action) {
      return action(req, res);
    }
  },
  '/api/:resource::action/:resourceIndex': (req: any, res: any) => {
    const action = resources[req.params.resource][req.params.action];
    if (action) {
      return action(req, res);
    }
  },
}
