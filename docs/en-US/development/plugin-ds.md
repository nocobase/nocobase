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

If you want to customize the packaging configuration, you can create a `config.js` file in the root directory, with the following content:

```js
module.exports = {
  modifyViteConfig: (config) => {
    // vite is used to package the `src/client` side code

    // Modify the Vite configuration, for more information, please refer to: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup is used to package the `src/server` side code

    // Modify the tsup configuration, for more information, please refer to: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
}
```
