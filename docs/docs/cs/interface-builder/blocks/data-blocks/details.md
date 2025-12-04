:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Blok Detailů

## Úvod

Blok Detailů slouží k zobrazení hodnot jednotlivých polí každého datového záznamu. Podporuje flexibilní rozvržení polí a obsahuje vestavěné funkce pro práci s daty, což uživatelům usnadňuje prohlížení a správu informací.

## Nastavení bloku

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### Pravidla propojení bloku

Chování bloku (např. zda se má zobrazit nebo spustit JavaScript) můžete řídit pomocí pravidel propojení.

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
Více informací naleznete v části [Pravidla propojení](/interface-builder/linkage-rule)

### Nastavení rozsahu dat

Příklad: Zobrazit pouze zaplacené objednávky.

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

Více informací naleznete v části [Nastavení rozsahu dat](/interface-builder/blocks/block-settings/data-scope)

### Pravidla propojení polí

Pravidla propojení v bloku Detailů podporují dynamické nastavení zobrazení/skrytí polí.

Příklad: Nezobrazovat částku, pokud je stav objednávky „Zrušeno“.

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

Více informací naleznete v části [Pravidla propojení](/interface-builder/linkage-rule)

## Konfigurace polí

### Pole z této kolekce

> **Poznámka**: Pole z děděných kolekcí (tj. pole z rodičovských kolekcí) se automaticky sloučí a zobrazí v aktuálním seznamu polí.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### Pole z přidružených kolekcí

> **Poznámka**: Zobrazení polí z přidružených kolekcí je podporováno (v současné době pouze pro vztahy typu „jedna k jedné“).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### Další pole
- JS Field
- JS Item
- Oddělovač
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **Tip**: Můžete psát JavaScript pro implementaci vlastního obsahu zobrazení, což vám umožní zobrazit složitější informace.  
> Například můžete vykreslit různé efekty zobrazení na základě různých datových typů, podmínek nebo logiky.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## Konfigurace akcí

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [Upravit](/interface-builder/actions/types/edit)
- [Smazat](/interface-builder/actions/types/delete)
- [Odkaz](/interface-builder/actions/types/link)
- [Vyskakovací okno](/interface-builder/actions/types/pop-up)
- [Aktualizovat záznam](/interface-builder/actions/types/update-record)
- [Spustit pracovní postup](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI zaměstnanec](/interface-builder/actions/types/ai-employee)