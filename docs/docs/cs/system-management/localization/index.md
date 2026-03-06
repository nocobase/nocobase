:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/system-management/localization/index).
:::

# Správa lokalizace

## Úvod

Plugin Správa lokalizace slouží ke správě a implementaci lokalizačních zdrojů NocoBase. Umožňuje překládat systémová menu, kolekce, pole a všechny pluginy, aby se přizpůsobily jazyku a kultuře konkrétních regionů.

## Instalace

Tento plugin je vestavěný a nevyžaduje žádnou dodatečnou instalaci.

## Návod k použití

### Aktivace pluginu

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### Vstup na stránku správy lokalizace

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### Synchronizace překladových položek

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

V současné době je podporována synchronizace následujícího obsahu:

- Lokální jazykové balíčky systému a pluginů
- Názvy kolekcí, názvy polí a štítky možností polí
- Názvy menu

Po dokončení synchronizace systém vypíše všechny přeložitelné položky pro aktuální jazyk.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=Tip}
Různé moduly mohou obsahovat stejné původní textové položky, které je nutné přeložit samostatně.
:::

### Automatické vytváření položek

Při úpravě stránky se pro vlastní texty v jednotlivých blocích automaticky vytvoří odpovídající položky a současně se vygeneruje obsah překladu pro aktuální jazyk.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Tip}
Při definování textu v kódu je nutné ručně zadat ns (jmenný prostor), například: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Úprava obsahu překladu

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

### Publikování překladu

Po dokončení překladu je nutné kliknout na tlačítko „Publikovat“, aby se změny projevily.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### Překlad do jiných jazyků

V „Nastavení systému“ povolte další jazyky, například zjednodušenou čínštinu.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

Přepněte se do tohoto jazykového prostředí.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

Synchronizujte položky.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

Přeložte a publikujte.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>