---
title: "createFormRegistry"
description: "createFormRegistry: Eine interne Registry für Plugin-Erweiterungen erstellen."
keywords: "createFormRegistry,NocoBase,client-v2"
---

# createFormRegistry

`createFormRegistry` dient dazu: eine interne Registry für Plugin-Erweiterungen erstellen.

## Grundlegende Verwendung

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

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `register(entry)` | `-` | Eintrag registrieren |
| `unregister(name)` | `-` | Eintrag entfernen |
| `get(name)` | `-` | Eintrag per Name abrufen |
| `has(name)` | `-` | Prüfen, ob ein Eintrag existiert |
| `list()` | `-` | Alle Einträge zurückgeben |
