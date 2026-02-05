:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Kolekce

V rámci vývoje **pluginů** pro NocoBase je **kolekce (datová tabulka)** jedním z klíčových konceptů. Pomocí definování nebo rozšiřování kolekcí můžete v pluginech přidávat nebo upravovat struktury datových tabulek. Na rozdíl od datových tabulek vytvářených prostřednictvím rozhraní pro správu **zdrojů dat** jsou **kolekce definované v kódu obvykle systémové metadatové tabulky** a nezobrazují se v seznamu správy **zdrojů dat**.

## Definování datových tabulek

Podle konvenční adresářové struktury by soubory **kolekcí** měly být umístěny v adresáři `./src/server/collections`. Pro vytváření nových tabulek použijte `defineCollection()` a pro rozšiřování stávajících tabulek `extendCollection()`.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Ukázkové články',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Název', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Obsah' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Autor' },
    },
  ],
});
```

Ve výše uvedeném příkladu:

- `name`: Název tabulky (v databázi se automaticky vygeneruje tabulka se stejným názvem).
- `title`: Zobrazovaný název tabulky v uživatelském rozhraní.
- `fields`: Kolekce polí, kde každé pole obsahuje atributy jako `type`, `name` a další.

Pokud potřebujete přidat pole nebo upravit konfiguraci pro **kolekce** jiných **pluginů**, můžete použít `extendCollection()`:

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

Po aktivaci **pluginu** systém automaticky přidá pole `isPublished` do stávající tabulky `articles`.

:::tip
Konvenční adresář se načte před spuštěním všech metod `load()` **pluginů**, čímž se předejde problémům se závislostmi způsobeným nenačtením některých datových tabulek.
:::

## Synchronizace databázové struktury

Při první aktivaci **pluginu** systém automaticky synchronizuje konfigurace **kolekcí** s databázovou strukturou. Pokud je **plugin** již nainstalován a běží, po přidání nebo úpravě **kolekcí** je třeba ručně spustit příkaz pro upgrade:

```bash
yarn nocobase upgrade
```

Pokud během synchronizace dojde k výjimkám nebo nekonzistentním datům, můžete strukturu tabulky obnovit přeinstalováním aplikace:

```bash
yarn nocobase install -f
```

## Automatické generování zdrojů (Resource)

Po definování **kolekce** systém automaticky vygeneruje odpovídající zdroj (Resource), na kterém můžete přímo provádět operace CRUD (vytváření, čtení, aktualizace, mazání) prostřednictvím API. Podrobnosti naleznete v [Správci zdrojů](./resource-manager.md).