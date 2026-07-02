# Migración

## app

## db

## plugin

## Sequelize

## queryInterface

## Crear archivo de Migration

Mediante el comando CLI:

```bash
nb scaffold migration my-migration --pkg @my-project/plugin-hello
```

El comando generará un archivo con marca de tiempo en el directorio `src/server/migrations/` del plugin, con la siguiente plantilla:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<versión actual>';

  async up() {
    // coding
  }
}
```

Parámetros del comando:

| Parámetro | Descripción |
|------|------|
| `<name>` | Nombre de la migration, utilizado para generar el nombre del archivo |
| `--pkg <pkg>` | Nombre del paquete, determina la ruta de almacenamiento del archivo |
| `--on <on>` | Momento de ejecución, por defecto `'afterLoad'` |