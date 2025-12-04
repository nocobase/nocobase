---
pkg: "@nocobase/plugin-block-list"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Listblock

## Introduktion

Listblocket visar data i listformat och passar för scenarier som uppgiftslistor, nyheter och produktinformation.

## Blockkonfiguration

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### Ställ in dataomfång

Som visas: Filtrera för beställningar med statusen "Avbruten".

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

För mer information, se [Ställ in dataomfång](/interface-builder/blocks/block-settings/data-scope)

### Ställ in sorteringsregler

Som visas: Sortera efter orderbelopp i fallande ordning.

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

För mer information, se [Ställ in sorteringsregler](/interface-builder/blocks/block-settings/sorting-rule)

## Konfigurera fält

### Fält från denna samling

> **Obs**: Fält från ärvda samlingar (d.v.s. överordnade samlingar) slås automatiskt samman och visas i den aktuella fältlistan.

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### Fält från relaterade samlingar

> **Obs**: Fält från relaterade samlingar kan visas (för närvarande stöds endast en-till-en-relationer).

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

För konfiguration av listfält, se [Detaljfält](/interface-builder/fields/generic/detail-form-item)

## Konfigurera åtgärder

### Globala åtgärder

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

- [Filtrera](/interface-builder/actions/types/filter)
- [Lägg till](/interface-builder/actions/types/add-new)
- [Ta bort](/interface-builder/actions/types/delete)
- [Uppdatera](/interface-builder/actions/types/refresh)
- [Importera](/interface-builder/actions/types/import)
- [Exportera](/interface-builder/actions/types/export)
- [Mallutskrift](/template-print/index)
- [Massuppdatera](/interface-builder/actions/types/bulk-update)
- [Exportera bilagor](/interface-builder/actions/types/export-attachments)
- [Utlös arbetsflöde](/interface-builder/actions/types/trigger-workflow)
- [JS-åtgärd](/interface-builder/actions/types/js-action)
- [AI-medarbetare](/interface-builder/actions/types/ai-employee)

### Radåtgärder

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)

- [Redigera](/interface-builder/actions/types/edit)
- [Ta bort](/interface-builder/actions/types/delete)
- [Länk](/interface-builder/actions/types/link)
- [Popup](/interface-builder/actions/types/pop-up)
- [Uppdatera post](/interface-builder/actions/types/update-record)
- [Mallutskrift](/template-print/index)
- [Utlös arbetsflöde](/interface-builder/actions/types/trigger-workflow)
- [JS-åtgärd](/interface-builder/actions/types/js-action)
- [AI-medarbetare](/interface-builder/actions/types/ai-employee)