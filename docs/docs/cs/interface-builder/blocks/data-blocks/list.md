---
pkg: "@nocobase/plugin-block-list"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Blok seznamu

## Úvod

Blok seznamu zobrazuje data ve formě seznamu a je vhodný pro scénáře zobrazení dat, jako jsou seznamy úkolů, novinky nebo informace o produktech.

## Konfigurace bloku

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### Nastavení rozsahu dat

Jak je znázorněno: Filtrujte objednávky se stavem „Zrušeno“.

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

Více podrobností naleznete v části [Nastavení rozsahu dat](/interface-builder/blocks/block-settings/data-scope)

### Nastavení pravidel řazení

Jak je znázorněno: Seřadit podle částky objednávky v sestupném pořadí.

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

Více podrobností naleznete v části [Nastavení pravidel řazení](/interface-builder/blocks/block-settings/sorting-rule)

## Konfigurace polí

### Pole z této kolekce

> **Poznámka**: Pole z děděných kolekcí (tj. pole z nadřazených kolekcí) se automaticky sloučí a zobrazí v aktuálním seznamu polí.

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### Pole z přidružených kolekcí

> **Poznámka**: Lze zobrazit pole z přidružených kolekcí (v současné době jsou podporovány pouze vztahy „jeden k jednomu“).

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

Konfiguraci polí seznamu naleznete v části [Pole podrobností](/interface-builder/fields/generic/detail-form-item)

## Konfigurace akcí

### Globální akce

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

- [Filtrovat](/interface-builder/actions/types/filter)
- [Přidat](/interface-builder/actions/types/add-new)
- [Smazat](/interface-builder/actions/types/delete)
- [Obnovit](/interface-builder/actions/types/refresh)
- [Importovat](/interface-builder/actions/types/import)
- [Exportovat](/interface-builder/actions/types/export)
- [Tisk šablony](/template-print/index)
- [Hromadná aktualizace](/interface-builder/actions/types/bulk-update)
- [Exportovat přílohy](/interface-builder/actions/types/export-attachments)
- [Spustit pracovní postup](/interface-builder/actions/types/trigger-workflow)
- [Akce JS](/interface-builder/actions/types/js-action)
- [AI zaměstnanec](/interface-builder/actions/types/ai-employee)

### Akce řádku

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)

- [Upravit](/interface-builder/actions/types/edit)
- [Smazat](/interface-builder/actions/types/delete)
- [Odkaz](/interface-builder/actions/types/link)
- [Vyskakovací okno](/interface-builder/actions/types/pop-up)
- [Aktualizovat záznam](/interface-builder/actions/types/update-record)
- [Tisk šablony](/template-print/index)
- [Spustit pracovní postup](/interface-builder/actions/types/trigger-workflow)
- [Akce JS](/interface-builder/actions/types/js-action)
- [AI zaměstnanec](/interface-builder/actions/types/ai-employee)