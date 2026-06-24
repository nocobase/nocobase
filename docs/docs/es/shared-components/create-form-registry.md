---
title: "createFormRegistry"
description: "createFormRegistry: Crear un registro interno para extensiones del plugin."
keywords: "createFormRegistry,NocoBase,client-v2"
---

# createFormRegistry

`createFormRegistry` sirve para crear un registro interno para extensiones del plugin.

## Uso básico

```ts
import { createFormRegistry, type FormRegistryEntry } from '@nocobase/client-v2';

interface StorageType extends FormRegistryEntry {
  title: string;
  Component: React.ComponentType;
}

const storageTypes = createFormRegistry<StorageType>('file-manager/storage-types');

storageTypes.register({ name: 'local', title: 'Local', Component: LocalStorageForm });
storageTypes.register({ name: 's3', title: 'Amazon S3', Component: S3StorageForm });

const s3 = storageTypes.get('s3');
const all = storageTypes.list();
```

## API

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `register(entry)` | `-` | Registrar una entrada |
| `unregister(name)` | `-` | Eliminar una entrada |
| `get(name)` | `-` | Obtener una entrada por nombre |
| `has(name)` | `-` | Comprobar si existe una entrada |
| `list()` | `-` | Devolver todas las entradas |
