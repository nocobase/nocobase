:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Samlingar (datatabeller)

Inom NocoBase-pluginutveckling är **samlingar (datatabeller)** ett av de mest centrala koncepten. Genom att definiera eller utöka samlingar kan ni lägga till eller ändra datatabellstrukturer i era plugin. Till skillnad från datatabeller som skapas via gränssnittet för datakällshantering, är **samlingar som definieras i kod oftast systemomfattande metadata-tabeller** och visas inte i listan för datakällshantering.

## Definiera datatabeller

Enligt den konventionella katalogstrukturen ska samlingsfiler placeras i katalogen `./src/server/collections`. Använd `defineCollection()` för att skapa nya tabeller och `extendCollection()` för att utöka befintliga tabeller.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Exempelartiklar',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Rubrik', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Innehåll' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Författare' },
    },
  ],
});
```

I exemplet ovan:

- `name`: Tabellnamn (en tabell med samma namn genereras automatiskt i databasen).
- `title`: Tabellens visningsnamn i gränssnittet.
- `fields`: En samling fält, där varje fält innehåller attribut som `type` och `name`.

När ni behöver lägga till fält eller ändra konfigurationer för samlingar i andra plugin kan ni använda `extendCollection()`:

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

Efter att pluginet har aktiverats kommer systemet automatiskt att lägga till fältet `isPublished` till den befintliga `articles`-tabellen.

:::tip
Den konventionella katalogen laddas klart innan alla pluginets `load()`-metoder körs, vilket förhindrar beroendeproblem som orsakas av att vissa datatabeller inte har laddats.
:::

## Synkronisera databasstruktur

När ett plugin aktiveras för första gången synkroniserar systemet automatiskt samlingskonfigurationerna med databasstrukturen. Om pluginet redan är installerat och körs, behöver ni manuellt köra uppgraderingskommandot efter att ni har lagt till eller ändrat samlingar:

```bash
yarn nocobase upgrade
```

Om det uppstår undantag eller felaktig data under synkroniseringen kan ni återskapa tabellstrukturen genom att ominstallera applikationen:

```bash
yarn nocobase install -f
```

## Automatisk generering av resurser

Efter att ni har definierat en samling genererar systemet automatiskt en motsvarande resurs. Ni kan sedan direkt utföra CRUD-operationer (skapa, läsa, uppdatera, radera) på denna resurs via API:et. Se [Resurshantering](./resource-manager.md).