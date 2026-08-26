---
title: "AddSubModelButton"
description: "AddSubModelButton: subModel zu einem angegebenen FlowModel hinzufügen, mit Unterstützung für asynchrone Menüs, Gruppen, Untermenüs, Filterung nach Basisklasse sowie Toggle-Form."
keywords: "AddSubModelButton,subModel,SubModel,FlowModel,FlowEngine,Asynchrones Menü,Gruppenmenü"
---

# AddSubModelButton

Dient zum Hinzufügen eines Submodells (subModel) zu einem angegebenen `FlowModel`. Unterstützt unter anderem asynchrones Laden, Gruppierung, Untermenüs und benutzerdefinierte Vererbungsregeln für Modelle.

## Props

```ts pure
interface AddSubModelButtonProps {
  model: FlowModel;
  subModelKey: string;
  subModelType?: 'object' | 'array';
  items?: SubModelItemsType;
  subModelBaseClass?: string | ModelConstructor;
  subModelBaseClasses?: Array<string | ModelConstructor>;
  afterSubModelInit?: (subModel: FlowModel) => Promise<void>;
  afterSubModelAdd?: (subModel: FlowModel) => Promise<void>;
  afterSubModelRemove?: (subModel: FlowModel) => Promise<void>;
  children?: React.ReactNode;
  keepDropdownOpen?: boolean;
}
```

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `model` | `FlowModel` | **Erforderlich.** Das Zielmodell, dem das Submodell hinzugefügt werden soll. |
| `subModelKey` | `string` | **Erforderlich.** Der Schlüsselname des Submodells in `model.subModels`. |
| `subModelType` | `'object' \| 'array'` | Datenstrukturtyp des Submodells, Standardwert ist `'array'`. |
| `items` | `SubModelItem[]` \| `(ctx) => SubModelItem[] \| Promise<...>` | Definition der Menüeinträge, unterstützt statische oder asynchrone Erzeugung. |
| `subModelBaseClass` | `string` \| `ModelConstructor` | Gibt eine Basisklasse an; alle von ihr erbenden Modelle werden als Menüeinträge aufgelistet. |
| `subModelBaseClasses` | `(string \| ModelConstructor)[]` | Gibt mehrere Basisklassen an; erbende Modelle werden automatisch nach Gruppen aufgelistet. |
| `afterSubModelInit` | `(subModel) => Promise<void>` | Callback nach der Initialisierung des Submodells. |
| `afterSubModelAdd` | `(subModel) => Promise<void>` | Callback nach dem Hinzufügen des Submodells. |
| `afterSubModelRemove` | `(subModel) => Promise<void>` | Callback nach dem Entfernen des Submodells. |
| `children` | `React.ReactNode` | Inhalt der Schaltfläche; kann als Text oder Symbol angepasst werden. |
| `keepDropdownOpen` | `boolean` | Ob das Dropdown-Menü nach dem Hinzufügen geöffnet bleiben soll. Standardmäßig wird es automatisch geschlossen. |

## SubModelItem-Typdefinition

```ts pure
interface SubModelItem {
  key?: string;
  label?: string;
  type?: 'group' | 'divider';
  disabled?: boolean;
  hide?: boolean | ((ctx: FlowModelContext) => boolean | Promise<boolean>);
  icon?: React.ReactNode;
  children?: SubModelItemsType;
  useModel?: string;
  createModelOptions?: {
    props?: Record<string, any>;
    stepParams?: Record<string, any>;
  };
  toggleable?: boolean | ((model: FlowModel) => boolean);
}
```

| Feld | Typ | Beschreibung |
| --- | --- | --- |
| `key` | `string` | Eindeutige Kennung. |
| `label` | `string` | Anzeigetext. |
| `type` | `'group' \| 'divider'` | Gruppe oder Trennlinie. Wenn nicht angegeben, ist es ein normaler Eintrag oder ein Untermenü. |
| `disabled` | `boolean` | Ob der aktuelle Eintrag deaktiviert ist. |
| `hide` | `boolean` \| `(ctx) => boolean \| Promise<boolean>` | Dynamisches Ausblenden (Rückgabe `true` bedeutet ausgeblendet). |
| `icon` | `React.ReactNode` | Symbolinhalt. |
| `children` | `SubModelItemsType` | Untermenüeinträge, verwendet für verschachtelte Gruppen oder Untermenüs. |
| `useModel` | `string` | Der zu verwendende Model-Typ (registrierter Name). |
| `createModelOptions` | `object` | Parameter zur Initialisierung des Modells. |
| `toggleable` | `boolean` \| `(model: FlowModel) => boolean` | Toggle-Form: bereits hinzugefügt wird entfernt, noch nicht hinzugefügt wird hinzugefügt (nur eines erlaubt). |

## Beispiele

### subModels mit `<AddSubModelButton />` hinzufügen

```tsx file="./_demos/add-sub-model/add-sub-model-basic.tsx" preview
```

- subModels werden mit `<AddSubModelButton />` hinzugefügt; die Schaltfläche muss in einem FlowModel platziert werden, damit sie verwendbar ist.
- Verwenden Sie `model.mapSubModels()`, um über subModels zu iterieren; die Methode `mapSubModels` löst Probleme wie fehlende Einträge und Sortierung.
- Verwenden Sie `<FlowModelRenderer />`, um subModels zu rendern.

### Verschiedene Formen von AddSubModelButton

```tsx file="./_demos/add-sub-model/add-sub-model-icon.tsx" preview
```

- Sie können die Schaltflächenkomponente `<Button>Add block</Button>` verwenden und beliebig platzieren.
- Sie können auch ein Symbol wie `<PlusOutlined />` verwenden.
- Sie können sie auch oben rechts an der Position von Flow Settings platzieren.

### Toggle-Form unterstützen

```tsx file="./_demos/add-sub-model/add-sub-model-toggleable.tsx" preview
```

- Für einfache Szenarien genügt `toggleable: true`; standardmäßig wird nach Klassenname gesucht und nur eine Instanz pro Klasse zugelassen.
- Benutzerdefinierte Suchregel: `toggleable: (model: FlowModel) => boolean`.

### Asynchrone items

```tsx file="./_demos/add-sub-model/add-sub-model-async-items.tsx" preview
```

Sie können dynamische items aus dem Kontext beziehen, zum Beispiel:

- Eine Remote-Anfrage über `ctx.api.request()`.
- Notwendige Daten aus den von `ctx.dataSourceManager` bereitgestellten APIs abrufen.
- Eigene Kontextattribute oder -methoden verwenden.
- Sowohl `items` als auch `children` unterstützen asynchrone Aufrufe.

### Menüeinträge dynamisch ausblenden (hide)

```tsx file="./_demos/add-sub-model/add-sub-model-hide.tsx" preview
```

- `hide` unterstützt `boolean` oder eine Funktion (auch async); Rückgabe `true` bedeutet ausgeblendet.
- Wirkt rekursiv auf Gruppen und children.

### Gruppen, Untermenüs und Trennlinien verwenden

```tsx file="./_demos/add-sub-model/add-sub-model-basic-children.tsx" preview
```

- `type: divider` bedeutet eine Trennlinie.
- `type: group` mit `children` bedeutet eine Menügruppe.
- Mit `children`, aber ohne `type` ergibt sich ein Untermenü.

### items über Vererbungsklassen automatisch generieren

```tsx file="./_demos/add-sub-model/add-sub-model-base-class.tsx" preview
```

- Alle von `subModelBaseClass` erbenden FlowModels werden aufgelistet.
- Mit `Model.define()` lassen sich zugehörige Metadaten definieren.
- Mit `hide: true` markierte Einträge werden automatisch ausgeblendet.

### Gruppierung über Vererbungsklassen umsetzen

```tsx file="./_demos/add-sub-model/add-sub-model-base-class-group.tsx" preview
```

- Alle von `subModelBaseClasses` erbenden FlowModels werden aufgelistet.
- Automatische Gruppierung nach `subModelBaseClasses` mit Deduplizierung.

### Zweistufiges Menü über Vererbungsklassen + `menuType=submenu`

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-base-class.tsx" preview
```

- Geben Sie der Basisklasse über `Model.define({ menuType: 'submenu' })` die Anzeigeform vor.
- Sie erscheint als Eintrag der ersten Ebene und klappt zu einem Menü der zweiten Ebene auf; sie kann mit anderen Gruppen über `meta.sort` gemischt sortiert werden.

### Untermenüs über `Model.defineChildren()` anpassen

```tsx file="./_demos/add-sub-model/add-sub-model-define-children.tsx" preview
```

### group children über `Model.defineChildren()` anpassen

```tsx file="./_demos/add-sub-model/add-sub-model-group-children.tsx" preview
```

### Suche in Untermenüs aktivieren

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-search.tsx" preview
```

- Jeder Menüeintrag, der `children` enthält, zeigt bei `searchable: true` auf dieser Ebene ein Suchfeld an.
- Es werden gemischte Strukturen aus group und Nicht-group auf derselben Ebene unterstützt; die Suche wirkt nur auf die aktuelle Ebene.
