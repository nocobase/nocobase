---
pkg: "@nocobase/plugin-client"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# Routemanager

## Introductie

De routemanager is een hulpmiddel voor het beheren van de routes van de hoofdpagina van het systeem, en ondersteunt zowel `desktop` als `mobiele` apparaten. Routes die u met de routemanager aanmaakt, worden automatisch weergegeven in het menu (u kunt dit configureren om ze niet in het menu te tonen). Omgekeerd verschijnen menu's die u via het paginamenu toevoegt, ook in de lijst van de routemanager.

![20250107115449](https://static-docs.nocobase.com/20250107115449.png)

## Gebruikershandleiding

### Routetypen

Het systeem ondersteunt vier typen routes:

- Groep (group): Wordt gebruikt om routes te groeperen en te beheren, en kan subroutes bevatten.
- Pagina (page): Een interne systeempagina.
- Tab (tab): Een routetype dat wordt gebruikt om te schakelen tussen tabbladen binnen een pagina.
- Link (link): Een interne of externe link die direct naar het geconfigureerde adres kan springen.

### Route toevoegen

Klik op de knop "Add new" rechtsboven om een nieuwe route aan te maken:

1. Selecteer het routetype (Type)
2. Vul de routetitel in (Title)
3. Selecteer het route-icoon (Icon)
4. Configureer of de route in het menu moet worden weergegeven (Show in menu)
5. Configureer of tabbladen moeten worden ingeschakeld (Enable page tabs)
6. Voor het paginatype genereert het systeem automatisch een uniek routepad (Path)

![20250124131803](https://static-docs.nocobase.com/20250124131803.png)

### Route-acties

Elke route-item ondersteunt de volgende acties:

- Add child: Voeg een subroute toe
- Edit: Bewerk de routeconfiguratie
- View: Bekijk de routepagina
- Delete: Verwijder de route

### Bulkacties

De bovenste werkbalk biedt de volgende bulkacties:

- Refresh: Ververs de routelijst
- Delete: Verwijder de geselecteerde routes
- Hide in menu: Verberg de geselecteerde routes in het menu
- Show in menu: Toon de geselecteerde routes in het menu

### Route filteren

Gebruik de "Filter"-functie bovenaan om de routelijst naar behoefte te filteren.

:::info{title=Opmerking}
Het wijzigen van routeconfiguraties heeft directe invloed op de navigatiemenustructuur van het systeem. Ga voorzichtig te werk en zorg ervoor dat de routeconfiguraties correct zijn.
:::