:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/filter-manager).
:::

# ctx.filterManager

Der Filter-Verbindungs-Manager wird verwendet, um die Filterverknüpfungen zwischen Filterformularen (FilterForm) und Datenblöcken (Tabellen, Listen, Diagramme usw.) zu verwalten. Er wird vom `BlockGridModel` bereitgestellt und ist nur in dessen Kontext (z. B. Filterformular-Blöcke, Datenblöcke) verfügbar.

## Anwendungsbereiche

| Szenario | Beschreibung |
|------|------|
| **Filterformular-Block** | Verwaltet Verbindungskonfigurationen zwischen Filterelementen und Zielblöcken; aktualisiert die Zieldaten, wenn sich Filter ändern. |
| **Datenblock (Tabelle/Liste)** | Fungiert als Filterziel und bindet Filterbedingungen über `bindToTarget`. |
| **Verknüpfungsregeln / Benutzerdefiniertes FilterModel** | Ruft `refreshTargetsByFilter` innerhalb von `doFilter` oder `doReset` auf, um Aktualisierungen der Ziele auszulösen. |
| **Konfiguration der Verbindungsfelder** | Verwendet `getConnectFieldsConfig` und `saveConnectFieldsConfig`, um Feldzuordnungen zwischen Filtern und Zielen zu verwalten. |

> Hinweis: `ctx.filterManager` ist nur in RunJS-Kontexten verfügbar, die über ein `BlockGridModel` verfügen (z. B. innerhalb einer Seite, die ein Filterformular enthält); in regulären JS-Blöcken oder unabhängigen Seiten ist er `undefined`. Es wird empfohlen, vor dem Zugriff Optional Chaining zu verwenden.

## Typdefinitionen

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID des Filtermodells
  targetId: string;   // UID des Zieldatenblock-Modells
  filterPaths?: string[];  // Feldpfade des Zielblocks
  operator?: string;  // Filteroperator
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Gängige Methoden

| Methode | Beschreibung |
|------|------|
| `getFilterConfigs()` | Ruft alle aktuellen Filter-Verbindungskonfigurationen ab. |
| `getConnectFieldsConfig(filterId)` | Ruft die Konfiguration der Verbindungsfelder für einen bestimmten Filter ab. |
| `saveConnectFieldsConfig(filterId, config)` | Speichert die Konfiguration der Verbindungsfelder für einen Filter. |
| `addFilterConfig(config)` | Fügt eine Filterkonfiguration hinzu (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Entfernt Filterkonfigurationen nach filterId, targetId oder beidem. |
| `bindToTarget(targetId)` | Bindet die Filterkonfiguration an einen Zielblock und löst die Anwendung des Filters auf dessen Ressource aus. |
| `unbindFromTarget(targetId)` | Hebt die Filterbindung vom Zielblock auf. |
| `refreshTargetsByFilter(filterId | filterId[])` | Aktualisiert die Daten der verknüpften Zielblöcke basierend auf den Filtern. |

## Kernkonzepte

- **FilterModel**: Ein Modell, das Filterbedingungen bereitstellt (z. B. FilterFormItemModel). Es muss `getFilterValue()` implementieren, um den aktuellen Filterwert zurückzugeben.
- **TargetModel**: Der Datenblock, der gefiltert wird; seine `resource` muss `addFilterGroup`, `removeFilterGroup` und `refresh` unterstützen.

## Beispiele

### Filterkonfiguration hinzufügen

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Zielblöcke aktualisieren

```ts
// In doFilter / doReset eines Filterformulars
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Ziele aktualisieren, die mit mehreren Filtern verknüpft sind
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Konfiguration der Verbindungsfelder

```ts
// Verbindungskonfiguration abrufen
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// Verbindungskonfiguration speichern
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Konfiguration entfernen

```ts
// Alle Konfigurationen für einen bestimmten Filter löschen
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Alle Filterkonfigurationen für ein bestimmtes Ziel löschen
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Verwandte Themen

- [ctx.resource](./resource.md): Die Ressource des Zielblocks muss die Filterschnittstelle unterstützen.
- [ctx.model](./model.md): Wird verwendet, um die UID des aktuellen Modells für filterId / targetId abzurufen.