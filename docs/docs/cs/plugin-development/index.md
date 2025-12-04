:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Přehled vývoje pluginů

NocoBase využívá **mikrojádrovou architekturu**, kde jádro je zodpovědné pouze za plánování životního cyklu pluginů, správu závislostí a zapouzdření základních funkcí. Všechny obchodní funkce jsou poskytovány ve formě pluginů. Proto je pochopení organizační struktury, životního cyklu a způsobu správy pluginů prvním krokem k přizpůsobení NocoBase.

## Základní koncepty

- **Plug and Play** (Zapoj a hraj): Pluginy lze instalovat, povolovat nebo zakazovat podle potřeby, což umožňuje flexibilní kombinaci obchodních funkcí bez nutnosti úpravy kódu.
- **Full-stack integrace** (Kompletní integrace): Pluginy obvykle zahrnují implementace na straně serveru i klienta, což zajišťuje konzistenci mezi datovou logikou a interakcemi uživatelského rozhraní.

## Základní struktura pluginu

Každý plugin je nezávislý npm balíček, který obvykle obsahuje následující adresářovou strukturu:

```bash
plugin-hello/
├─ package.json          # Název pluginu, závislosti a metadata pluginu NocoBase
├─ client.js             # Výstup front-end kompilace pro načítání za běhu
├─ server.js             # Výstup serverové kompilace pro načítání za běhu
├─ src/
│  ├─ client/            # Zdrojový kód na straně klienta, může registrovat bloky, akce, pole atd.
│  └─ server/            # Zdrojový kód na straně serveru, může registrovat zdroje, události, příkazy atd.
```

## Konvence adresářů a pořadí načítání

NocoBase ve výchozím nastavení pro načítání pluginů prohledává následující adresáře:

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Pluginy ve vývoji (nejvyšší priorita)
└── storage/
    └── plugins/          # Zkompilované pluginy, např. nahrané nebo publikované pluginy
```

- `packages/plugins`: Používá se pro lokální vývoj pluginů, podporuje kompilaci a ladění v reálném čase.
- `storage/plugins`: Ukládá zkompilované pluginy, například komerční edice nebo pluginy třetích stran.

## Životní cyklus a stavy pluginu

Plugin obvykle prochází následujícími fázemi:

1. **Vytvoření** (`create`): Vytvoření šablony pluginu pomocí CLI.
2. **Stažení** (`pull`): Stažení balíčku pluginu lokálně, ale ještě není zapsán do databáze.
3. **Povolení** (`enable`): Při prvním povolení provede „registraci + inicializaci“; následná povolení pouze načtou logiku.
4. **Zakázání** (`disable`): Zastaví běh pluginu.
5. **Odebrání** (`remove`): Úplné odebrání pluginu ze systému.

:::tip

- `pull` pouze stáhne balíček pluginu; skutečný proces instalace je spuštěn prvním `enable`.
- Pokud je plugin pouze stažen (`pull`), ale není povolen (`enable`), nebude načten.

:::

### Příklady CLI příkazů

```bash
# 1. Vytvoření kostry pluginu
yarn pm create @my-project/plugin-hello

# 2. Stažení balíčku pluginu (stáhnout nebo propojit)
yarn pm pull @my-project/plugin-hello

# 3. Povolení pluginu (při prvním povolení se automaticky nainstaluje)
yarn pm enable @my-project/plugin-hello

# 4. Zakázání pluginu
yarn pm disable @my-project/plugin-hello

# 5. Odebrání pluginu
yarn pm remove @my-project/plugin-hello
```

## Rozhraní pro správu pluginů

Přístupem do správce pluginů v prohlížeči můžete pluginy intuitivně prohlížet a spravovat:

**Výchozí URL adresa:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Správce pluginů](https://static-docs.nocobase.com/20251030195350.png)