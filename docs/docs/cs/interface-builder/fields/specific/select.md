:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Rozbalovací seznam

## Úvod

Rozbalovací seznam umožňuje propojit data výběrem z existujících dat v cílové kolekci, nebo přidáním nových dat do ní a následným propojením. Možnosti v rozbalovacím seznamu podporují fuzzy vyhledávání.

![20251029205901](https://static-docs.nocobase.com/20251029205901.png)

## Konfigurace pole

### Nastavení rozsahu dat

Určuje rozsah dat v rozbalovacím seznamu.

![20251029210025](https://static-docs.nocobase.com/20251029210025.png)

Více informací naleznete v [Nastavení rozsahu dat](/interface-builder/fields/field-settings/data-scope)

### Nastavení pravidel řazení

Určuje řazení dat v rozbalovacím seznamu.

Příklad: Seřadit podle data služby v sestupném pořadí.

![20251029210105](https://static-docs.nocobase.com/20251029210105.png)

### Povolit přidání/propojení více záznamů

Omezuje vztah typu „jeden k mnoha“ tak, aby bylo možné propojit pouze jeden záznam.

![20251029210145](https://static-docs.nocobase.com/20251029210145.png)

### Pole názvu

Pole názvu je pole štítku zobrazené v možnostech.

![20251029210507](https://static-docs.nocobase.com/20251029210507.gif)

> Podporuje rychlé vyhledávání na základě pole názvu.

Více informací naleznete v [Pole názvu](/interface-builder/fields/field-settings/title-field)

### Rychlé vytvoření: Nejprve přidat, poté vybrat

![20251125220046](https://static-docs.nocobase.com/20251125220046.png)

#### Přidání přes rozbalovací nabídku

Po vytvoření nového záznamu v cílové kolekci jej systém automaticky vybere a propojí po odeslání formuláře.

Kolekce Objednávky má pole vztahu „mnoho k jednomu“ s názvem `Account`.

![20251125220447](https://static-docs.nocobase.com/20251125220447.gif)

#### Přidání přes modální okno

Přidání přes modální okno je vhodné pro složitější scénáře zadávání dat a umožňuje konfigurovat formulář pro vytváření nových záznamů.

![20251125220607](https://static-docs.nocobase.com/20251125220607.gif)

[Komponenta pole](/interface-builder/fields/association-field)