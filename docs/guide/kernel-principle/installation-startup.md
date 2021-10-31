---
order: 3
---

# Installation and Startup Process

## Installation

```bash
yarn nocobase init
```

- app.constructor()
- app.parse()
  - yarn nocobase init  
    Initialize the installation
    - app.load()  
      Load the configuration
      - app.exitAsync('beforeLoad')  
        Hook before all configurations are loaded
      - app.pluginManager.load()  
        Load the configurations of all active plugins in order
        - Load the configuration of plugin-collections
        - Add app.on('init') listener
          - db.getModel('collections').load()  
            Import the collections table configuration into db.table()
          - app.db.sync({force: false})  
            Execute sync again to create the data table configured in the collections table
      - app.exitAsync('afterLoad')  
        All hooks after the configuration is loaded
      - app.db.sync({force: true})  
        Generate data tables, fields, indexes, etc. according to the configuration
      - app.emitAsync('init')  
        Perform all init listeners, generally initialized data operations
        - trigger the init event of plugin-collections and the data table is created
      - app.stop()  
        End

## Startup

```bash
yarn nocobase start --init --sync
# --init for quick installation at startup
# --sync to quickly build or update tables when app.collection() is updated in the development environment
```

- app.constructor()
- app.parse()
  - yarn nocobase start  
    Initialize the installation
    - app.load()  
      Load the configuration
      - app.exitAsync('beforeLoad')  
        Hook before all configurations are loaded
      - app.pluginManager.load()
        Load the configurations of all active plugins in order
        - Load the configuration of plugin-collections
          - Add app.on('start') listener
          - db.getModel('collections').load()  
            Import the collections table configuration into db.table(), no need for db.sync in the start process
      - app.exitAsync('afterLoad')  
        All hooks after configuration loading
      - app.db.sync({force: false})  
        yarn nocobase start --sync to quickly build or update tables when there are updates  
        yarn nocobase start --init quick init
      - app.emitAsync('init')  
        yarn nocobase start --init shortcut init
      - app.exitAsync('start')  
        Execute all start listeners, usually reading some necessary data from the data table
      - app.listen()
        Start the http server
