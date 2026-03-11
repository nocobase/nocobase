:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/interface-builder/fields/specific/sub-table-popup).
:::

# Podtabulka (úprava v pop-upu)

## Představení

Podtabulka (úprava v pop-upu) slouží ke správě vícenásobných asociačních dat (např. One-to-Many nebo Many-to-Many) v rámci formuláře. Tabulka zobrazuje pouze aktuálně přidružené záznamy. Přidávání nebo úpravy záznamů probíhají v pop-up okně a data jsou do databáze uložena hromadně při odeslání hlavního formuláře.

## Návod k použití

![20260212152204](https://static-docs.nocobase.com/20260212152204.png)

**Vhodné scénáře:**

- Asociační pole: O2M / M2M / MBM
- Typické použití: Detaily objednávky, seznamy podpoložek, přidružené štítky/členové atd.

## Konfigurace pole

### Povolit výběr existujících dat (výchozí: zapnuto)

Podporuje výběr vazeb z již existujících záznamů.

![20260212152312](https://static-docs.nocobase.com/20260212152312.png)

![20260212152343](https://static-docs.nocobase.com/20260212152343.gif)

### Komponenta pole

[Komponenta pole](/interface-builder/fields/association-field): Přepnutí na jiné komponenty asociačních polí, jako je výběr ze seznamu (Select), výběr z kolekce atd.

### Povolit zrušení vazby u existujících dat (výchozí: zapnuto)

> Určuje, zda je v editačním formuláři povoleno odpojit již přidružená data. Nově přidaná data lze odebrat vždy.

![20260212165752](https://static-docs.nocobase.com/20260212165752.gif)

### Povolit přidávání (výchozí: zapnuto)

Určuje, zda se zobrazí tlačítko pro přidání. Pokud uživatel nemá oprávnění `create` pro cílovou kolekci, tlačítko bude deaktivováno s upozorněním na nedostatečná oprávnění.

### Povolit rychlou úpravu (výchozí: vypnuto)

Po zapnutí se při najetí myší na buňku zobrazí ikona úprav, která umožňuje rychlou změnu obsahu buňky.

Rychlou úpravu můžete povolit pro všechna pole prostřednictvím nastavení komponenty asociačního pole.

![20260212165102](https://static-docs.nocobase.com/20260212165102.png)

Lze ji také povolit pro jednotlivá pole ve sloupcích.

![20260212165025](https://static-docs.nocobase.com/20260212165025.png)

![20260212165201](https://static-docs.nocobase.com/20260212165201.gif)

### Velikost stránky (výchozí: 10)

Nastavuje počet záznamů zobrazených na jedné stránce podtabulky.

## Poznámky k chování

- Při výběru existujících záznamů probíhá odstranění duplicit na základě primárního klíče, aby se zabránilo opakovanému přidružení stejného záznamu.
- Nově přidané záznamy se ihned propíší do podtabulky a zobrazení automaticky přeskočí na stránku obsahující nový záznam.
- Řádková úprava mění pouze data v aktuálním řádku.
- Odebrání pouze zruší vazbu v rámci aktuálního formuláře; zdrojová data nebudou z databáze smazána.
- Data jsou do databáze uložena hromadně až při odeslání hlavního formuláře.