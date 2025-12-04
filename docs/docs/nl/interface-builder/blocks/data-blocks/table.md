:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Tabelblok

## Introductie

Het Tabelblok is een van de kern datablokken die ingebouwd zijn in **NocoBase** en wordt voornamelijk gebruikt om gestructureerde gegevens in tabelvorm weer te geven en te beheren. Het biedt flexibele configuratieopties, zodat u de kolommen, kolombreedtes, sorteerregels en het gegevensbereik van de tabel kunt aanpassen aan uw specifieke zakelijke behoeften.

#### Belangrijkste functies:
- **Flexibele kolomconfiguratie**: U kunt de kolommen en kolombreedtes van de tabel aanpassen aan verschillende weergavebehoeften.
- **Sorteerregels**: Ondersteunt het sorteren van tabelgegevens. U kunt gegevens oplopend of aflopend sorteren op basis van verschillende velden.
- **Instelling gegevensbereik**: Door het gegevensbereik in te stellen, kunt u bepalen welke gegevens worden weergegeven, om verstoring door irrelevante gegevens te voorkomen.
- **Actieconfiguratie**: Het Tabelblok heeft verschillende ingebouwde actieopties. U kunt eenvoudig acties zoals filteren, nieuw toevoegen, bewerken en verwijderen configureren voor snel gegevensbeheer.
- **Snel bewerken**: Ondersteunt direct bewerken van gegevens binnen de tabel, wat het operationele proces vereenvoudigt en de efficiëntie verhoogt.

## Blokinstellingen

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### Blokkoppelingsregels

Beheer het gedrag van het blok (bijvoorbeeld of het wordt weergegeven of JavaScript uitvoert) via koppelingsregels.

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

Voor meer details, zie [Koppelingsregels](/interface-builder/linkage-rule)

### Gegevensbereik instellen

Voorbeeld: Filter standaard bestellingen waarvan de "Status" "Betaald" is.

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

Voor meer details, zie [Gegevensbereik instellen](/interface-builder/blocks/block-settings/data-scope)

### Sorteerregels instellen

Voorbeeld: Toon bestellingen in aflopende volgorde op datum.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

Voor meer details, zie [Sorteerregels instellen](/interface-builder/blocks/block-settings/sorting-rule)

### Snel bewerken inschakelen

Activeer "Snel bewerken inschakelen" in de blokinstellingen en tabelkolominstellingen om aan te passen welke kolommen snel bewerkt kunnen worden.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### Boomtabel inschakelen

Wanneer de gegevenscollectie een hiërarchische (boom)structuur heeft, kunt u in het tabelblok de functie "Boomtabel inschakelen" activeren. Deze optie staat standaard uit. Eenmaal ingeschakeld, zal het blok gegevens in een boomstructuur weergeven en de bijbehorende configuratieopties en bewerkingen ondersteunen.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### Alle rijen standaard uitvouwen

Wanneer de boomtabel is ingeschakeld, ondersteunt het blok het standaard uitvouwen van alle onderliggende gegevens bij het laden.

## Velden configureren

### Velden van deze collectie

> **Let op**: Velden van geërfde collecties (d.w.z. velden van de bovenliggende collectie) worden automatisch samengevoegd en weergegeven in de huidige lijst met velden.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### Velden van gerelateerde collecties

> **Let op**: Ondersteunt het weergeven van velden uit gerelateerde collecties (momenteel alleen voor één-op-één relaties).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### Overige aangepaste kolommen

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [JS Field](/interface-builder/fields/specific/js-field)
- [JS Column](/interface-builder/fields/specific/js-column)

## Acties configureren

### Globale acties

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [Filteren](/interface-builder/actions/types/filter)
- [Nieuw toevoegen](/interface-builder/actions/types/add-new)
- [Verwijderen](/interface-builder/actions/types/delete)
- [Vernieuwen](/interface-builder/actions/types/refresh)
- [Importeren](/interface-builder/actions/types/import)
- [Exporteren](/interface-builder/actions/types/export)
- [Sjabloon afdrukken](/template-print/index)
- [Bulk bijwerken](/interface-builder/actions/types/bulk-update)
- [Bijlagen exporteren](/interface-builder/actions/types/export-attachments)
- [Workflow activeren](/interface-builder/actions/types/trigger-workflow)
- [JS Actie](/interface-builder/actions/types/js-action)
- [AI Medewerker](/interface-builder/actions/types/ai-employee)

### Rij-acties

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [Bekijken](/interface-builder/actions/types/view)
- [Bewerken](/interface-builder/actions/types/edit)
- [Verwijderen](/interface-builder/actions/types/delete)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Link](/interface-builder/actions/types/link)
- [Record bijwerken](/interface-builder/actions/types/update-record)
- [Sjabloon afdrukken](/template-print/index)
- [Workflow activeren](/interface-builder/actions/types/trigger-workflow)
- [JS Actie](/interface-builder/actions/types/js-action)
- [AI Medewerker](/interface-builder/actions/types/ai-employee)