import * as workflows from './workflows';
import * as nodes from './nodes';

function make(name, mod) {
  return Object.keys(mod).reduce((result, key) => ({
    ...result,
    [`${name}:${key}`]: mod[key]
  }), {})
}

export default function({ app }) {
  app.actions({
    ...make('workflows', workflows),
    ...make('workflows.nodes', {
      create: nodes.create,
      destroy: nodes.destroy
    }),
    ...make('flow_nodes', {
      update: nodes.update
    })
  });
}
