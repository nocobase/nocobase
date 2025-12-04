:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Collecties

Binnen de NocoBase plugin-ontwikkeling is een **collectie (gegevenstabel)** een van de meest fundamentele concepten. U kunt de structuur van gegevenstabellen in plugins toevoegen of aanpassen door collecties te definiëren of uit te breiden. In tegenstelling tot gegevenstabellen die u via de interface voor gegevensbronbeheer aanmaakt, zijn **collecties die in code zijn gedefinieerd meestal systeemgerelateerde metadatatabellen** en verschijnen ze niet in de lijst van gegevensbronbeheer.

## Collecties definiëren

Volgens de conventionele mapstructuur plaatst u collectiebestanden in de map `./src/server/collections`. Gebruik `defineCollection()` om nieuwe tabellen aan te maken en `extendCollection()` om bestaande tabellen uit te breiden.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Voorbeeldartikelen',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Titel', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Inhoud' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Auteur' },
    },
  ],
});
```

In het bovenstaande voorbeeld:

- `name`: De tabelnaam (er wordt automatisch een tabel met dezelfde naam in de database aangemaakt).
- `title`: De weergavenaam van de tabel in de interface.
- `fields`: De verzameling velden, waarbij elk veld eigenschappen zoals `type` en `name` bevat.

Wanneer u velden wilt toevoegen of configuraties wilt wijzigen voor collecties van andere plugins, kunt u `extendCollection()` gebruiken:

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

Na het activeren van de plugin voegt het systeem automatisch het veld `isPublished` toe aan de bestaande `articles`-tabel.

:::tip
De conventionele map wordt geladen voordat alle `load()`-methoden van plugins worden uitgevoerd, waardoor afhankelijkheidsproblemen door niet-geladen gegevenstabellen worden voorkomen.
:::

## Databasestructuur synchroniseren

Wanneer een plugin voor het eerst wordt geactiveerd, synchroniseert het systeem automatisch de collectieconfiguraties met de databasestructuur. Als de plugin al is geïnstalleerd en actief is, moet u na het toevoegen of wijzigen van collecties handmatig de upgrade-opdracht uitvoeren:

```bash
yarn nocobase upgrade
```

Als er tijdens de synchronisatie uitzonderingen of 'dirty data' optreden, kunt u de tabelstructuur opnieuw opbouwen door de applicatie opnieuw te installeren:

```bash
yarn nocobase install -f
```

## Automatisch resources genereren

Nadat u een collectie heeft gedefinieerd, genereert het systeem automatisch een corresponderende resource, waarop u direct CRUD-bewerkingen kunt uitvoeren via de API. Zie [Resourcebeheer](./resource-manager.md).