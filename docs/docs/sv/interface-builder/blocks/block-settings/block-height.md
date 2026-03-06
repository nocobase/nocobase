:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/interface-builder/blocks/block-settings/block-height).
:::

# Blockhöjd

## Introduktion

Blockhöjd stöder tre lägen: **Standardhöjd**, **Angiven höjd** och **Full höjd**. De flesta block stöder höjdinställningar.

![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Höjdlägen

### Standardhöjd

Strategin för standardhöjd varierar för olika typer av block. Till exempel anpassar tabell- och formulärblock sin höjd automatiskt baserat på innehållet, och inga rullningslister visas inuti blocket.

### Angiven höjd

Ni kan manuellt ange den totala höjden för blockets yttre ram. Blocket kommer automatiskt att beräkna och fördela den tillgängliga höjden internt.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Full höjd

Läget för full höjd liknar angiven höjd, men blockhöjden beräknas baserat på webbläsarens aktuella **viewport** (visningsområde) för att uppnå maximal höjd på hela skärmen. Inga rullningslister visas på webbläsarsidan; rullningslister visas endast inuti blocket.

Hanteringen av intern rullning i läget för full höjd skiljer sig något mellan olika block:

- **Tabell**: Intern rullning inom `tbody`;
- **Formulär / Detaljer**: Intern rullning inom rutnätet (innehållsrullning exklusive åtgärdsområdet);
- **Lista / Rutnätskort**: Intern rullning inom rutnätet (innehållsrullning exklusive åtgärdsområdet och sidnumreringsfältet);
- **Karta / Kalender**: Övergripande anpassningsbar höjd, inga rullningslister;
- **Iframe / Markdown**: Begränsar den totala höjden på blockramen, rullningslister visas inuti blocket.

#### Tabell i full höjd

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Formulär i full höjd

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)