:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Detaljblock

## Introduktion

Detaljblocket används för att visa fältvärdena för varje datapost. Det stöder flexibla fältlayouter och har inbyggda funktioner för datahantering, vilket gör det enkelt för användare att visa och hantera information.

## Blockinställningar

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### Regler för blockkoppling

Kontrollera blockets beteende (t.ex. om det ska visas eller om JavaScript ska köras) med hjälp av kopplingsregler.

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
Mer information hittar ni i [Kopplingsregler](/interface-builder/linkage-rule)

### Ställ in dataomfång

Exempel: Visa endast betalda ordrar

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

Mer information hittar ni i [Ställ in dataomfång](/interface-builder/blocks/block-settings/data-scope)

### Regler för fältkoppling

Kopplingsregler i detaljblocket stöder dynamisk inställning av fält för att visas/döljas.

Exempel: Visa inte beloppet när orderstatusen är "Avbruten".

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

Mer information hittar ni i [Kopplingsregler](/interface-builder/linkage-rule)

## Konfigurera fält

### Fält från denna samling

> **Obs**: Fält från ärvda samlingar (d.v.s. fält från föräldrasamlingar) slås automatiskt samman och visas i den aktuella fältlistan.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### Fält från relaterade samlingar

> **Obs**: Det går att visa fält från relaterade samlingar (för närvarande endast för en-till-en-relationer).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### Övriga fält
- JS Field
- JS Item
- Avdelare
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **Tips**: Ni kan skriva JavaScript för att implementera anpassat visningsinnehåll, vilket gör att ni kan visa mer komplex information.  
> Ni kan till exempel rendera olika visningseffekter baserat på olika datatyper, villkor eller logik.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## Konfigurera åtgärder

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [Redigera](/interface-builder/actions/types/edit)
- [Ta bort](/interface-builder/actions/types/delete)
- [Länk](/interface-builder/actions/types/link)
- [Popup](/interface-builder/actions/types/pop-up)
- [Uppdatera post](/interface-builder/actions/types/update-record)
- [Utlös arbetsflöde](/interface-builder/actions/types/trigger-workflow)
- [JS-åtgärd](/interface-builder/actions/types/js-action)
- [AI-medarbetare](/interface-builder/actions/types/ai-employee)