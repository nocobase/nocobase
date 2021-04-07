import * as renders from './renders';

export default function getInterfaceRender(name: string): Function {
  return renders[name] || renders._;
}
