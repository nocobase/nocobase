:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/resource/single-record-resource) voor nauwkeurige informatie.
:::

# SingleRecordResource

Een Resource gericht op een **enkele record**: gegevens bestaan uit een enkel object, met ondersteuning voor ophalen via de primaire sleutel, aanmaken/bijwerken (save) en verwijderen. Geschikt voor scenario's met "enkele records" zoals details en formulieren. In tegenstelling tot [MultiRecordResource](./multi-record-resource.md) retourneert de methode `getData()` van `SingleRecordResource` een enkel object. U specificeert de primaire sleutel via `setFilterByTk(id)`, en `save()` roept automatisch `create` of `update` aan op basis van de `isNewRecord`-status.

**Overervingshiërarchie**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Aanmaakmethode**: `ctx.makeResource('SingleRecordResource')` of `ctx.initResource('SingleRecordResource')`. Voor gebruik moet u `setResourceName('collectienaam')` aanroepen; bij bewerkingen op basis van de primaire sleutel gebruikt u `setFilterByTk(id)`. In RunJS wordt `ctx.api` geïnjecteerd door de runtime-omgeving.

---

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **Detail-blok** | Het detail-blok gebruikt standaard `SingleRecordResource` om een enkele record te laden via de primaire sleutel. |
| **Formulier-blok** | Formulieren voor aanmaken/bewerken gebruiken `SingleRecordResource`, waarbij `save()` automatisch onderscheid maakt tussen `create` en `update`. |
| **JSBlock details** | Laad een enkele gebruiker, bestelling, etc. in een JSBlock en pas de weergave aan. |
| **Gerelateerde resources** | Gebruik formaten zoals `users.profile` om gerelateerde records te laden, in combinatie met `setSourceId(parentRecordID)`. |

---

## Gegevensformaat

- `getData()` retourneert een **enkel record-object**, wat overeenkomt met het `data`-veld van de get-API-respons.
- `getMeta()` retourneert metagegevens (indien beschikbaar).

---

## Resourcenaam en primaire sleutel

| Methode | Beschrijving |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Resourcenaam, bijv. `'users'`, `'users.profile'` (gerelateerde resource). |
| `setSourceId(id)` / `getSourceId()` | ID van de bovenliggende record bij gerelateerde resources (bijv. `users.profile` vereist de primaire sleutel van de `users`-record). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Gegevensbron-identificatie (gebruikt bij meerdere gegevensbronnen). |
| `setFilterByTk(tk)` / `getFilterByTk()` | Primaire sleutel van de huidige record; na instellen wordt `isNewRecord` false. |

---

## Status

| Eigenschap/Methode | Beschrijving |
|----------|------|
| `isNewRecord` | Of het een "nieuwe" status betreft (true als `filterByTk` niet is ingesteld of bij een nieuwe aanmaak). |

---

## Verzoekparameters (Filter / Velden)

| Methode | Beschrijving |
|------|------|
| `setFilter(filter)` / `getFilter()` | Filter (beschikbaar wanneer niet in "nieuwe" status). |
| `setFields(fields)` / `getFields()` | Opgevraagde velden. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Laden van relaties (appends). |

---

## CRUD

| Methode | Beschrijving |
|------|------|
| `refresh()` | Voert een get-verzoek uit op basis van de huidige `filterByTk` en werkt `getData()` bij; doet niets in de "nieuwe" status. |
| `save(data, options?)` | Roept `create` aan in de "nieuwe" status, anders `update`; optioneel `{ refresh: false }` om automatisch verversen te voorkomen. |
| `destroy(options?)` | Verwijdert de record op basis van de huidige `filterByTk` en wist lokale gegevens. |
| `runAction(actionName, options)` | Roept een willekeurige resource-actie aan. |

---

## Configuratie en gebeurtenissen

| Methode | Beschrijving |
|------|------|
| `setSaveActionOptions(options)` | Verzoekconfiguratie voor de `save`-actie. |
| `on('refresh', fn)` / `on('saved', fn)` | Geactiveerd nadat het verversen is voltooid of na het opslaan. |

---

## Voorbeelden

### Basis ophalen en bijwerken

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Bijwerken
await ctx.resource.save({ name: 'Jan Jansen' });
```

### Nieuwe record aanmaken

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Piet Puk', email: 'pietpuk@example.com' });
```

### Record verwijderen

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// Na destroy is getData() null
```

### Laden van relaties en velden

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Gerelateerde resources (bijv. users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Primaire sleutel van bovenliggende record
res.setFilterByTk(profileId);    // filterByTk kan worden weggelaten als profile een hasOne-relatie is
await res.refresh();
const profile = res.getData();
```

### Opslaan zonder automatisch verversen

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// getData() behoudt de oude waarde omdat refresh niet wordt geactiveerd na het opslaan
```

### Luisteren naar refresh / saved gebeurtenissen

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>Gebruiker: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Succesvol opgeslagen');
});
await ctx.resource?.refresh?.();
```

---

## Opmerkingen

- **setResourceName is verplicht**: U moet `setResourceName('collectienaam')` aanroepen voor gebruik, anders kan de verzoek-URL niet worden opgebouwd.
- **filterByTk en isNewRecord**: Als `setFilterByTk` niet is ingesteld, is `isNewRecord` true en zal `refresh()` geen verzoek verzenden; `save()` zal een `create`-actie uitvoeren.
- **Gerelateerde resources**: Wanneer de resourcenaam het formaat `parent.child` heeft (bijv. `users.profile`), moet u eerst `setSourceId(primaire sleutel van ouder)` aanroepen.
- **getData retourneert een object**: De `data` die wordt geretourneerd door single-record API's is een record-object; `getData()` retourneert dit object direct. Na `destroy()` wordt dit null.

---

## Gerelateerd

- [ctx.resource](../context/resource.md) - De resource-instantie in de huidige context
- [ctx.initResource()](../context/init-resource.md) - Initialiseren en binden aan `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Een nieuwe resource-instantie aanmaken zonder te binden
- [APIResource](./api-resource.md) - Algemene API-resource opgevraagd via URL
- [MultiRecordResource](./multi-record-resource.md) - Gericht op collecties/lijsten, met ondersteuning voor CRUD en paginering