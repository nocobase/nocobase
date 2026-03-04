:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/interface-builder/fields/specific/sub-table).
:::

# Podtabulka (inline editace)

## Úvod

Podtabulka je vhodná pro práci s relačními poli typu One-to-Many (O2M). Podporuje hromadné vytváření a následné propojení nových dat v cílové kolekci, nebo výběr a propojení existujících dat.

## Použití

![20251027223350](https://static-docs.nocobase.com/20251027223350.png)

Různé typy polí v podtabulce zobrazují různé komponenty polí. Velká pole (například Rich Text, JSON, Long Text) se upravují prostřednictvím vyskakovacího modálního okna.

![20251027223426](https://static-docs.nocobase.com/20251027223426.png)

Relační pole v podtabulce.

Objednávky (One-to-Many (O2M)) > Produkty objednávek (One-to-One (O2O)) > Příležitost

![20251027223530](https://static-docs.nocobase.com/20251027223530.png)

Výchozí komponentou pro relační pole je Single select (podporuje Single select / Data selector).

![20251027223754](https://static-docs.nocobase.com/20251027223754.png)

## Možnosti konfigurace pole

### Povolit výběr existujících dat (ve výchozím nastavení zapnuto)

Podporuje výběr a propojení existujících dat.
![20251027224008](https://static-docs.nocobase.com/20251027224008.png)

![20251027224023](https://static-docs.nocobase.com/20251027224023.gif)

### Komponenta pole

[Komponenta pole](/interface-builder/fields/association-field): Přepněte na jiné komponenty relačních polí, jako je Single select, Data selector atd.;

### Povolit zrušení propojení existujících dat

> Zda povolit zrušení propojení existujících dat pro relační pole v editačním formuláři.

![20251028153425](https://static-docs.nocobase.com/20251028153425.gif)