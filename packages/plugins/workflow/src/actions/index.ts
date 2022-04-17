import * as flow_nodes from './flow_nodes';

function make(name, mod) {
  return Object.keys(mod).reduce((result, key) => ({
    ...result,
    [`${name}:${key}`]: mod[key]
  }), {})
}

export default function(app) {
  app.actions({
    ...make('flow_nodes', flow_nodes)
  });
}
