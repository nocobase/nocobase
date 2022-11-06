# Plugin directory structure

An empty plugin can be created quickly with `yarn pm create my-plugin`, with the following directory structure.

```bash
|- /my-plugin
  |- /src
    |- /client # client-side of the plugin
    |- /server # server-side of the plugin
  |- client.d.ts
  |- client.js
  |- package.json # plugin package information
  |- server.d.ts
  |- server.js
```

The tutorial for `/src/server` refers to the [server](./server) section, and the tutorial for `/src/client` refers to the [client](./client) section.
