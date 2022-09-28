import Topo from '@hapi/topo';

export class Toposort<T> extends Topo.Sorter<T> {
  unshift(...items) {
    (this as any)._items.unshift(
      ...items.map((node) => ({
        node,
        seq: (this as any)._items.length,
        sort: 0,
        before: [],
        after: [],
        group: '?',
      })),
    );
  }

  push(...items) {
    (this as any)._items.push(
      ...items.map((node) => ({
        node,
        seq: (this as any)._items.length,
        sort: 0,
        before: [],
        after: [],
        group: '?',
      })),
    );
  }
}

export { Options as ToposortOptions } from '@hapi/topo';

export default Toposort;
