:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Migrace

Během vývoje a aktualizací pluginů NocoBase může dojít k nekompatibilním změnám v databázové struktuře nebo konfiguraci pluginu. Pro zajištění hladkého průběhu upgradu NocoBase nabízí mechanismus **Migrace**, který tyto změny řeší pomocí migračních souborů. Tento článek vás systematicky provede používáním Migrace a jejím vývojovým procesem.

## Koncept Migrace

Migrace je skript, který se automaticky spouští během upgradů pluginů a slouží k řešení následujících problémů:

- Úpravy struktury databázových tabulek (např. přidání polí, změna typů polí atd.)
- Migrace dat (např. hromadné aktualizace hodnot polí)
- Aktualizace konfigurace pluginu nebo interní logiky

Doba spuštění Migrace se dělí do tří kategorií:

| Typ | Spouštěcí čas | Scénář spuštění |
|------|----------|----------|
| `beforeLoad` | Před načtením všech konfigurací pluginů | |
| `afterSync`  | Po synchronizaci konfigurací kolekcí s databází (struktura kolekce již byla změněna) | |
| `afterLoad`  | Po načtení všech konfigurací pluginů | |

## Vytvoření migračních souborů

Migrační soubory by měly být umístěny v adresáři pluginu pod `src/server/migrations/*.ts`. NocoBase poskytuje příkaz `create-migration` pro rychlé generování migračních souborů.

```bash
yarn nocobase create-migration [options] <name>
```

Volitelné parametry

| Parametr | Popis |
|------|----------|
| `--pkg <pkg>` | Určuje název balíčku pluginu |
| `--on [on]`  | Určuje dobu spuštění, možnosti: `beforeLoad`, `afterSync`, `afterLoad` |

Příklad

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

Cesta k vygenerovanému migračnímu souboru:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

Počáteční obsah souboru:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Zde napište logiku upgradu
  }
}
```

> ⚠️ `appVersion` slouží k identifikaci verze, na kterou se upgrade zaměřuje. Prostředí s verzemi nižšími než specifikovaná verze tuto migraci spustí.

## Psaní migrace

V migračních souborech můžete prostřednictvím `this` přistupovat k následujícím běžným vlastnostem a API, což usnadňuje práci s databází, pluginy a instancemi aplikace:

Běžné vlastnosti

- **`this.app`**  
  Aktuální instance aplikace NocoBase. Lze použít pro přístup ke globálním službám, pluginům nebo konfiguraci.  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  Instance databázové služby, poskytuje rozhraní pro práci s modely (kolekcemi).  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  Aktuální instance pluginu, lze použít pro přístup k vlastním metodám pluginu.  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  Instance Sequelize, může přímo provádět nativní SQL nebo transakční operace.  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  QueryInterface Sequelize, běžně se používá k úpravě struktur tabulek, například k přidávání polí, mazání tabulek atd.  
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Příklad psaní migrace

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Použijte queryInterface k přidání pole
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // Použijte db pro přístup k datovým modelům
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Spusťte vlastní metodu pluginu
    await this.plugin.customMethod();
  }
}
```

Kromě výše uvedených běžných vlastností poskytuje Migrace také bohaté API. Podrobnou dokumentaci naleznete v [Migration API](/api/server/migration).

## Spuštění migrace

Spuštění Migrace je vyvoláno příkazem `nocobase upgrade`:

```bash
$ yarn nocobase upgrade
```

Během upgradu systém určí pořadí spuštění na základě typu Migrace a `appVersion`.

## Testování migrace

Při vývoji pluginů se doporučuje použít **Mock Server** k otestování, zda se migrace provádí správně, aby nedošlo k poškození skutečných dat.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // Název pluginu
      version: '0.18.0-alpha.5', // Verze před upgradem
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // Zde napište ověřovací logiku, například kontrolu, zda pole existuje, zda migrace dat proběhla úspěšně
  });
});
```

> Tip: Použití Mock Serveru může rychle simulovat scénáře upgradu a ověřit pořadí spuštění Migrace a změny dat.

## Doporučení pro vývojovou praxi

1.  **Rozdělení migrací**  
    Snažte se generovat jeden migrační soubor pro každý upgrade, abyste zachovali atomicitu a zjednodušili řešení problémů.
2.  **Určení doby spuštění**  
    Vyberte `beforeLoad`, `afterSync` nebo `afterLoad` na základě objektů operace, abyste se vyhnuli závislosti na nenačtených modulech.
3.  **Správa verzí**  
    Použijte `appVersion` k jasnému určení verze, pro kterou je migrace určena, abyste zabránili opakovanému spuštění.
4.  **Testovací pokrytí**  
    Po ověření migrace na Mock Serveru proveďte upgrade v reálném prostředí.