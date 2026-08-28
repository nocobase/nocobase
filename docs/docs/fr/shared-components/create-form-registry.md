---
title: "createFormRegistry"
description: "createFormRegistry: Créer un registre interne pour les points d’extension du plugin."
keywords: "createFormRegistry,NocoBase,client-v2"
---

# createFormRegistry

`createFormRegistry` sert à créer un registre interne pour les points d’extension du plugin.

## Utilisation de base

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

| Paramètre | Type | Description |
| --- | --- | --- |
| `register(entry)` | `-` | Enregistrer une entrée |
| `unregister(name)` | `-` | Supprimer une entrée |
| `get(name)` | `-` | Obtenir une entrée par nom |
| `has(name)` | `-` | Vérifier si une entrée existe |
| `list()` | `-` | Retourner toutes les entrées |
