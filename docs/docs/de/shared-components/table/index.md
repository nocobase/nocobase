---
title: "Table"
description: "Table: Listen anzeigen, Zeilen auswählen und auf Einstellungsseiten per Drag sortieren."
keywords: "Table,NocoBase,client-v2"
---

# Table

`Table` dient dazu: listen anzeigen, Zeilen auswählen und auf Einstellungsseiten per Drag sortieren.



## Grundlegende Verwendung

```tsx file="../_demos/table.tsx" preview
```

## API

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `rowKey` | `string | (record, index) => React.Key` | Erforderliche Zeilenidentität |
| `showIndex` | `boolean` | Zeilennummer vor der Auswahl anzeigen |
| `isDraggable` | `boolean` | Ob Drag-Sortierung aktiviert ist |
| `onSortEnd` | `(from, to) => void | Promise<void>` | Wird nach Ende der Drag-Sortierung aufgerufen |
| `showSortHandle` | `boolean` | Ob der Standard-Drag-Handle angezeigt wird |
| `sortHandleColumnWidth` | `number` | Breite der automatischen Drag-Handle-Spalte |

## Zusätzliche Exporte

| Beschreibung | Beschreibung |
| --- | --- |
| `DEFAULT_PAGE_SIZE` | `50` |
| `PAGE_SIZE_OPTIONS` | `[5, 10, 20, 50, 100, 200]` |

## Verwandte Links

- [SortHandle](./sort-handle)
- [SortableRow](./sortable-row)
