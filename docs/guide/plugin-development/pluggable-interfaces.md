---
order: 2
---
# Pluggable Interfaces

Plugins are pluggable independent modules divided by functionality. In order to extend the functionality in the way of plugins, it is necessary to implement methods to add and remove extended functionality.  
The main pluggable interfaces of NocoBase are.

## Middleware

- add: app.use()
- remove: app.unuse() is not yet implemented, you can directly manipulate the app.middleware array to remove

## Events

- Add: app.on()
- Remove: app.removeListener()

## Resources

- Add: app.resource()
- Remove: None

## Actions

- Add: app.actions()
- Delete: None

## Data Tables

- Add: app.collection()
- Delete: None

## Components (front-end)

- Add createRouteSwitch, createCollectionField, createSchemaComponent
- Remove: None at this time

<Alert title="Note">

Currently, NocoBase's plug-in mechanism is not perfect and cannot fully implement hot-plugging. Front-end extensions have to be manually handled by developers and then rebuilt.

</Alert>
