:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/interface-builder/blocks/data-blocks/form).
:::

# Blok formuláře

## Úvod

Blok formuláře je důležitý blok pro vytváření rozhraní pro zadávání a úpravu dat. Je vysoce přizpůsobitelný a na základě datového modelu používá odpovídající komponenty k zobrazení požadovaných polí. Prostřednictvím toků událostí, jako jsou pravidla propojení, může blok formuláře dynamicky zobrazovat pole. Navíc jej lze kombinovat s pracovními postupy pro spouštění automatizovaných procesů a zpracování dat, což dále zvyšuje efektivitu práce nebo umožňuje orchestraci logiky.

## Přidání bloku formuláře

- **Upravit formulář**: Slouží k úpravě existujících dat.
- **Nový formulář**: Slouží k vytváření nových datových záznamů.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Konfigurační položky bloku

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Pravidla propojení bloku

Pomocí pravidel propojení můžete ovládat chování bloku (například zda se má zobrazit nebo spustit JavaScript).

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Více informací naleznete v [Pravidla propojení bloku](/interface-builder/blocks/block-settings/block-linkage-rule)

### Pravidla propojení polí

Pomocí pravidel propojení můžete ovládat chování polí formuláře.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Více informací naleznete v [Pravidla propojení polí](/interface-builder/blocks/block-settings/field-linkage-rule)

### Rozložení

Blok formuláře podporuje dva způsoby rozložení, které se nastavují pomocí vlastnosti `layout`:

- **horizontal** (horizontální rozložení): Toto rozložení zobrazuje popisky a obsah na jednom řádku, čímž šetří vertikální prostor; je vhodné pro jednoduché formuláře nebo případy s méně informacemi.
- **vertical** (vertikální rozložení) (výchozí): Popisky jsou umístěny nad poli. Toto rozložení usnadňuje čtení a vyplňování formuláře, zejména u formulářů s více poli nebo složitými vstupními položkami.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Konfigurace polí

### Pole této kolekce

> **Poznámka**: Pole z děděných kolekcí (tj. pole nadřazené kolekce) se automaticky sloučí a zobrazí v aktuálním seznamu polí.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Pole z relací

> Pole z relací jsou ve formuláři pouze pro čtení a obvykle se používají společně s poli relací k zobrazení více hodnot polí z přidružených dat.

![20260212161035](https://static-docs.nocobase.com/20260212161035.png)

- Aktuálně jsou podporovány pouze vazby typu "to-one" (např. belongsTo / hasOne atd.).
- Obvykle se používá ve spojení s polem relace (sloužícím k výběru souvisejícího záznamu): komponenta pole relace zodpovídá za výběr/změnu souvisejícího záznamu, zatímco pole z relace zodpovídá za zobrazení více informací o tomto záznamu (pouze pro čtení).

**Příklad**: Po výběru „Odpovědné osoby“ se ve formuláři zobrazí telefonní číslo, e-mail a další informace o této osobě.

> Pokud v editačním formuláři není nakonfigurováno pole relace „Odpovědná osoba“, lze odpovídající související informace stále zobrazit. Pokud je pole relace „Odpovědná osoba“ nakonfigurováno, při změně odpovědné osoby se související informace aktualizují podle odpovídajícího záznamu.

![20260212160748](https://static-docs.nocobase.com/20260212160748.gif)

### Ostatní pole

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Psaním JavaScriptu lze dosáhnout vlastního obsahu zobrazení a realizovat prezentaci složitého obsahu.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### Šablona pole

Šablony polí se používají k opakovanému použití konfigurací oblastí polí v blocích formuláře. Podrobnosti viz [Šablona pole](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

## Konfigurace akcí

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Odeslat](/interface-builder/actions/types/submit)
- [Spustit pracovní postup](/interface-builder/actions/types/trigger-workflow)
- [JS akce](/interface-builder/actions/types/js-action)
- [AI zaměstnanec](/interface-builder/actions/types/ai-employee)