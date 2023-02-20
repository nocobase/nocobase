import Plugin from "..";

function now() {
  return new Date();
}

export default function({ functions }: Plugin, more: { [key: string]: Function } = {}) {
  functions.register('now', now);

  for (const [name, fn] of Object.entries(more)) {
    functions.register(name, fn);
  }
};
