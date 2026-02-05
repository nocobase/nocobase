:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vytvořte svůj první plugin

Tento průvodce vás provede vytvořením blokového pluginu, který můžete použít na stránkách, a pomůže vám pochopit základní strukturu a vývojový pracovní postup pluginů NocoBase.

## Předpoklady

Než začnete, ujistěte se, že jste úspěšně nainstalovali NocoBase. Pokud ještě není nainstalováno, můžete se podívat na následující instalační příručky:

- [Instalace pomocí create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Instalace ze zdrojového kódu Git](/get-started/installation/git)

Po dokončení instalace můžete oficiálně zahájit svou cestu vývoje pluginů.

## Krok 1: Vytvoření kostry pluginu pomocí CLI

V kořenovém adresáři repozitáře spusťte následující příkaz pro rychlé vygenerování prázdného pluginu:

```bash
yarn pm create @my-project/plugin-hello
```

Po úspěšném spuštění příkazu se v adresáři `packages/plugins/@my-project/plugin-hello` vygenerují základní soubory. Výchozí struktura je následující:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Výchozí export serverového pluginu
     ├─ client                   # Umístění klientského kódu
     │  ├─ index.tsx             # Výchozí exportovaná třída klientského pluginu
     │  ├─ plugin.tsx            # Vstupní bod pluginu (rozšiřuje @nocobase/client Plugin)
     │  ├─ models                # Volitelné: frontendové modely (např. uzly pracovního postupu)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Umístění serverového kódu
     │  ├─ index.ts              # Výchozí exportovaná třída serverového pluginu
     │  ├─ plugin.ts             # Vstupní bod pluginu (rozšiřuje @nocobase/server Plugin)
     │  ├─ collections           # Volitelné: serverové kolekce
     │  ├─ migrations            # Volitelné: migrace dat
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Volitelné: vícejazyčnost
        ├─ en-US.json
        └─ zh-CN.json
```

Po vytvoření můžete v prohlížeči přejít na stránku správce pluginů (výchozí URL: http://localhost:13000/admin/settings/plugin-manager), abyste ověřili, zda se plugin objevil v seznamu.

## Krok 2: Implementace jednoduchého klientského bloku

Dále do pluginu přidáme vlastní blokový model, který zobrazí uvítací text.

1. **Vytvořte nový soubor blokového modelu** `client/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2. **Zaregistrujte blokový model**. Upravte `client/models/index.ts` a exportujte nový model pro načtení frontendovým runtime:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

Po uložení kódu, pokud spouštíte vývojový skript, byste měli v terminálu vidět logy horké aktualizace (hot-reload).

## Krok 3: Aktivace a vyzkoušení pluginu

Plugin můžete povolit pomocí příkazového řádku nebo rozhraní:

- **Příkazový řádek**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Administrační rozhraní**: Přejděte do správce pluginů, najděte `@my-project/plugin-hello` a klikněte na „Aktivovat“.

Po aktivaci vytvořte novou stránku „Modern page (v2)“. Při přidávání bloků uvidíte „Hello block“. Vložte jej na stránku a uvidíte uvítací obsah, který jste právě napsali.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## Krok 4: Sestavení a zabalení

Až budete připraveni distribuovat plugin do jiných prostředí, musíte jej nejprve sestavit a zabalit:

```bash
yarn build @my-project/plugin-hello --tar
# Nebo proveďte ve dvou krocích
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> Tip: Pokud je plugin vytvořen v repozitáři zdrojového kódu, první sestavení spustí kontrolu typů celého repozitáře, což může trvat delší dobu. Doporučujeme zajistit, aby byly závislosti nainstalovány a repozitář byl ve stavu, kdy je možné jej sestavit.

Po dokončení sestavení se soubor balíčku ve výchozím nastavení nachází v `storage/tar/@my-project/plugin-hello.tar.gz`.

## Krok 5: Nahrání do jiné aplikace NocoBase

Nahrajte a rozbalte do adresáře `./storage/plugins` cílové aplikace. Podrobnosti naleznete v [Instalace a aktualizace pluginů](../get-started/install-upgrade-plugins.mdx).