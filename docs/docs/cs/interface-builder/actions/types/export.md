---
pkg: "@nocobase/plugin-action-export"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Export

## Úvod

Funkce exportu umožňuje exportovat filtrované záznamy ve formátu **Excel** a podporuje konfiguraci polí pro export. Uživatelé si mohou vybrat pole, která potřebují exportovat pro následnou analýzu dat, zpracování nebo archivaci. Tato funkce zvyšuje flexibilitu datových operací, zejména ve scénářích, kde je potřeba data přenést na jiné platformy nebo je dále zpracovat.

### Klíčové vlastnosti:
- **Výběr polí**: Uživatelé si mohou nakonfigurovat a vybrat pole k exportu, čímž zajistí, že exportovaná data budou přesná a stručná.
- **Podpora formátu Excel**: Exportovaná data budou uložena jako standardní soubor Excel, což usnadňuje integraci a analýzu s dalšími daty.

Díky této funkci mohou uživatelé snadno exportovat klíčová data ze své práce pro externí použití, čímž se zvýší efektivita práce.

![20251029170811](https://static-docs.nocobase.com/20251029170811.png)

## Konfigurace akce

![20251029171452](https://static-docs.nocobase.com/20251029171452.png)

### Exportovatelná pole

- První úroveň: Všechna pole aktuální kolekce;
- Druhá úroveň: Pokud se jedná o asociační pole, je potřeba vybrat pole z přidružené kolekce;
- Třetí úroveň: Zpracovávají se pouze tři úrovně; asociační pole na poslední úrovni se nezobrazují;

![20251029171557](https://static-docs.nocobase.com/20251029171557.png)

- [Pravidlo propojení](/interface-builder/actions/action-settings/linkage-rule): Dynamicky zobrazit/skrýt tlačítko;
- [Upravit tlačítko](/interface-builder/actions/action-settings/edit-button): Upravit název, barvu a ikonu tlačítka;