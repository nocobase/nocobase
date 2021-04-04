Data Export Plugin for NocoBase
==========

Requirements
----------

* [plugin-collections](https://github.com/nocobase/nocobase/tree/master/packages/plugin-collections)

Installation
----------

In your NocoBase server root:

~~~shell
npm i @nocobase/plugin-export
~~~

Usage
----------

### Server

In app entry:

~~~js
const Server = require('@nocobase/server');
const server = new Server();
// register plugin
server.registerPlugin('@nocobase/plugin-export', [require('@nocobase/plugin-export/src/server')]);
~~~

### Client

~~~js
client
  .resource('table')
  .export(params)
  .then(response => {
    // handle application/octet-stream result
  });
~~~
