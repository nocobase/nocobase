---
pkg: "@nocobase/plugin-action-bulk-update"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Hromadná aktualizace

## Úvod

Akce hromadné aktualizace se používá v situacích, kdy potřebujete aplikovat stejnou aktualizaci na skupinu záznamů. Než provedete hromadnou aktualizaci, musíte předem definovat logiku přiřazení hodnot polí pro aktualizaci. Tato logika se pak aplikuje na všechny vybrané záznamy, jakmile kliknete na tlačítko pro aktualizaci.

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## Konfigurace akce

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### Data k aktualizaci

Vybrané/Všechny, výchozí je Vybrané.

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### Přiřazení polí

Nastavte pole pro hromadnou aktualizaci. Aktualizována budou pouze nastavená pole.

Jak je znázorněno na obrázku, nakonfigurujte akci hromadné aktualizace v tabulce objednávek tak, aby se vybraná data hromadně aktualizovala na stav „Čeká na schválení“.

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [Upravit tlačítko](/interface-builder/actions/action-settings/edit-button): Upravte název, typ a ikonu tlačítka;
- [Pravidlo propojení](/interface-builder/actions/action-settings/linkage-rule): Dynamicky zobrazit/skrýt tlačítko;
- [Dvojité potvrzení](/interface-builder/actions/action-settings/double-check)