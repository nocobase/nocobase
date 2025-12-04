:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Blok formuláře

## Úvod

Blok formuláře je klíčový blok pro vytváření rozhraní pro zadávání a úpravu dat. Je vysoce přizpůsobitelný a na základě datového modelu používá odpovídající komponenty k zobrazení požadovaných polí. Pomocí toků událostí, jako jsou pravidla propojení, může blok formuláře dynamicky zobrazovat pole. Navíc jej můžete kombinovat s pracovními postupy pro spouštění automatizovaných procesů a zpracování dat, což dále zvyšuje efektivitu práce nebo umožňuje orchestraci logiky.

## Přidání bloku formuláře

- **Upravit formulář**: Slouží k úpravě existujících dat.
- **Nový formulář**: Slouží k vytváření nových datových záznamů.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Nastavení bloku

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Pravidlo propojení bloku

Pomocí pravidel propojení můžete ovládat chování bloku (například zda se má zobrazit nebo spustit JavaScript).

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Více informací naleznete v [Pravidle propojení bloku](/interface-builder/blocks/block-settings/block-linkage-rule).

### Pravidlo propojení polí

Pomocí pravidel propojení můžete ovládat chování polí formuláře.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Více informací naleznete v [Pravidle propojení polí](/interface-builder/blocks/block-settings/field-linkage-rule).

### Rozložení

Blok formuláře podporuje dva způsoby rozložení, které můžete nastavit pomocí atributu `layout`:

- **horizontal** (horizontální rozložení): Toto rozložení zobrazuje popisek a obsah na jednom řádku, šetří vertikální prostor a je vhodné pro jednoduché formuláře nebo případy s menším množstvím informací.
- **vertical** (vertikální rozložení) (výchozí): Popisek je umístěn nad polem. Toto rozložení usnadňuje čtení a vyplňování formuláře, zejména u formulářů s více poli nebo složitějšími vstupními položkami.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Konfigurace polí

### Pole této kolekce

> **Poznámka**: Pole z děděných kolekcí (tj. pole rodičovské kolekce) jsou automaticky sloučena a zobrazena v aktuálním seznamu polí.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Další pole

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Napsáním JavaScriptu můžete přizpůsobit zobrazený obsah a zobrazit složité informace.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

## Konfigurace akcí

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Odeslat](/interface-builder/actions/types/submit)
- [Spustit pracovní postup](/interface-builder/actions/types/trigger-workflow)
- [JS akce](/interface-builder/actions/types/js-action)
- [AI zaměstnanec](/interface-builder/actions/types/ai-employee)