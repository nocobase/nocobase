import Plugin from "..";



export default function({ functions }: Plugin, more: { [key: string]: Function }) {
  functions.register('now', () => new Date());

  for (const [name, fn] of Object.entries(more)) {
    functions.register(name, fn);
  }
};
