---
order: 3
---

# Installation and Startup Process

## app.init

- app.load()
- db.sync()
- db.emitAsync('init')

## app.start

- app.load()
- db.emitAsync('start')
  - Load the collections configuration in the database
  - Load the pm configuration in the database
    - Start the activated plugin
- app.listen()
