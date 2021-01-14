import { extend } from "../../database";

export default extend({
  name: 'demos',
  actions: [
    {
      name: 'list',
    },
  ],
}, {
  arrayMerge: (t, s) => t.concat(s),
});
