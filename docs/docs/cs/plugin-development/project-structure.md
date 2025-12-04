:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Struktura projektu

Ať už klonujete zdrojový kód z Gitu, nebo inicializujete projekt pomocí `create-nocobase-app`, vygenerovaný projekt NocoBase je v podstatě monorepo založené na **Yarn Workspace**.

## Přehled kořenového adresáře

Následující příklad používá `my-nocobase-app/` jako kořenový adresář projektu. V různých prostředích se mohou vyskytovat drobné odchylky:

```bash
my-nocobase-app/
├── packages/              # Zdrojový kód projektu
│   ├── plugins/           # Zdrojový kód pluginů ve vývoji (nezkompilovaný)
├── storage/               # Data za běhu a dynamicky generovaný obsah
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Zkompilované pluginy (včetně těch nahraných přes uživatelské rozhraní)
│   └── tar/               # Balíčky pluginů (.tar)
├── scripts/               # Pomocné skripty a nástrojové příkazy
├── .env*                  # Konfigurace proměnných prostředí pro různá prostředí
├── lerna.json             # Konfigurace Lerna workspace
├── package.json           # Konfigurace kořenového balíčku, deklaruje workspace a skripty
├── tsconfig*.json         # Konfigurace TypeScriptu (frontend, backend, mapování cest)
├── vitest.config.mts      # Konfigurace jednotkových testů Vitest
└── playwright.config.ts   # Konfigurace E2E testů Playwright
```

## Popis podadresáře `packages/`

Adresář `packages/` obsahuje základní moduly NocoBase a rozšiřitelné balíčky. Jeho obsah závisí na zdroji projektu:

- **Projekty vytvořené pomocí `create-nocobase-app`**: Ve výchozím nastavení obsahuje pouze `packages/plugins/`, který slouží k ukládání zdrojového kódu vlastních pluginů. Každý podadresář je nezávislý npm balíček.
- **Klonovaný oficiální repozitář zdrojového kódu**: Zde naleznete více podadresářů, jako jsou `core/`, `plugins/`, `pro-plugins/`, `presets/` atd., které odpovídají jádru frameworku, vestavěným pluginům a oficiálním přednastaveným řešením.

Bez ohledu na typ projektu je `packages/plugins` hlavním místem pro vývoj a ladění vlastních pluginů.

## Adresář `storage/` pro data za běhu

`storage/` ukládá data generovaná za běhu a výstupy sestavení. Popisy běžných podadresářů jsou následující:

- `apps/`: Konfigurace a cache pro scénáře s více aplikacemi.
- `logs/`: Logy za běhu a výstupy ladění.
- `uploads/`: Uživatelsky nahrané soubory a mediální zdroje.
- `plugins/`: Zabalné pluginy nahrané přes uživatelské rozhraní nebo importované přes CLI.
- `tar/`: Komprimované balíčky pluginů vygenerované po spuštění `yarn build <plugin> --tar`.

> Obvykle se doporučuje přidat adresář `storage` do `.gitignore` a zpracovávat jej samostatně během nasazení nebo zálohování.

## Konfigurace prostředí a projektové skripty

- `.env`, `.env.test`, `.env.e2e`: Používají se pro lokální spouštění, jednotkové/integrační testování a end-to-end testování.
- `scripts/`: Obsahuje běžné údržbové skripty (například inicializaci databáze, nástroje pro vydání atd.).

## Cesty načítání pluginů a jejich priorita

Pluginy mohou existovat na více místech. NocoBase je při spuštění načítá v následujícím pořadí priorit:

1. Verze zdrojového kódu v `packages/plugins` (pro lokální vývoj a ladění).
2. Zabalná verze v `storage/plugins` (nahraná přes uživatelské rozhraní nebo importovaná přes CLI).
3. Závislé balíčky v `node_modules` (nainstalované přes npm/yarn nebo vestavěné ve frameworku).

Pokud plugin se stejným názvem existuje jak ve zdrojovém adresáři, tak v zabaleném adresáři, systém upřednostní načtení zdrojové verze, což usnadňuje lokální přepsání a ladění.

## Šablona adresáře pluginu

Vytvořte plugin pomocí CLI:

```bash
yarn pm create @my-project/plugin-hello
```

Vygenerovaná adresářová struktura je následující:

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # Výstup sestavení (generováno dle potřeby)
├── src/                     # Adresář zdrojového kódu
│   ├── client/              # Frontendový kód (bloky, stránky, modely atd.)
│   │   ├── plugin.ts        # Hlavní třída klientského pluginu
│   │   └── index.ts         # Klientský vstupní bod
│   ├── locale/              # Vícejazyčné zdroje (sdílené mezi frontendem a backendem)
│   ├── swagger/             # Dokumentace OpenAPI/Swagger
│   └── server/              # Kód na straně serveru
│       ├── collections/     # Definice kolekcí
│       ├── commands/        # Vlastní příkazy
│       ├── migrations/      # Skripty pro migrace databáze
│       ├── plugin.ts        # Hlavní třída serverového pluginu
│       └── index.ts         # Serverový vstupní bod
├── index.ts                 # Export pro propojení frontendu a backendu
├── client.d.ts              # Deklarace typů pro frontend
├── client.js                # Artefakt sestavení frontendu
├── server.d.ts              # Deklarace typů pro backend
├── server.js                # Artefakt sestavení backendu
├── .npmignore               # Konfigurace ignorování při publikování
└── package.json
```

> Po dokončení sestavení se adresář `dist/` a soubory `client.js`, `server.js` načtou, když je plugin povolen.
> Během vývoje stačí upravovat pouze adresář `src/`. Před publikováním spusťte `yarn build <plugin>` nebo `yarn build <plugin> --tar`.