:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/interface-builder/blocks/block-settings/block-height).
:::

# Výška bloku

## Úvod

Výška bloku podporuje tři režimy: **Výchozí výška**, **Zadaná výška** a **Plná výška**. Většina bloků nastavení výšky podporuje.

![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Režimy výšky

### Výchozí výška

Strategie výchozí výšky se u různých typů bloků liší. Například bloky tabulek a formulářů automaticky přizpůsobují svou výšku obsahu a uvnitř bloku se nezobrazují žádné posuvníky.

### Zadaná výška

Celkovou výšku vnějšího rámu bloku můžete zadat ručně. Blok automaticky vypočítá a přidělí dostupnou výšku interně.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Plná výška

Režim plné výšky je podobný zadané výšce, ale výška bloku se vypočítává na základě aktuálního **výřezu (viewportu)** prohlížeče, aby se dosáhlo maximální výšky přes celou obrazovku. Na stránce prohlížeče se nezobrazí žádné posuvníky; posuvníky se objeví pouze uvnitř bloku.

Zpracování vnitřního posouvání v režimu plné výšky se u jednotlivých bloků mírně liší:

- **Tabulka**: Vnitřní posouvání v rámci `tbody`;
- **Formulář / Detail**: Vnitřní posouvání v rámci mřížky (Grid) (posouvání obsahu s výjimkou oblasti akcí);
- **Seznam / Mřížka karet**: Vnitřní posouvání v rámci mřížky (Grid) (posouvání obsahu s výjimkou oblasti akcí a stránkovací lišty);
- **Mapa / Kalendář**: Celkově adaptivní výška, bez posuvníků;
- **Iframe / Markdown**: Omezuje celkovou výšku rámu bloku, posuvníky se zobrazují uvnitř bloku.

#### Tabulka na plnou výšku

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Formulář na plnou výšku

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)