---
pkg: "@nocobase/plugin-block-reference"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Referentieblok

## Introductie
Het Referentieblok toont een reeds geconfigureerd blok direct op de huidige pagina door de UID van het doelblok in te vullen. U hoeft het blok niet opnieuw te configureren.

## De plugin activeren
Deze plugin is ingebouwd, maar standaard uitgeschakeld.
Open 'Pluginbeheer' → zoek 'Blok: Referentie' → klik op 'Activeren'.

![Enable Reference block in Plugin Manager](https://static-docs.nocobase.com/block-reference-enable-20251102.png)

## Het blok toevoegen
1) Voeg een blok toe → Groep 'Overige blokken' → selecteer 'Referentieblok'.  
2) Vul in de 'Referentieblokinstellingen' het volgende in:
   - `Blok UID`: de UID van het doelblok
   - `Referentiemodus`: kies `Referentie` of `Kopiëren`

![Reference block add and configure demo](https://static-docs.nocobase.com/20251102193949_rec_.gif)

### Hoe u de Blok UID verkrijgt
- Open het instellingenmenu van het doelblok en klik op `UID kopiëren` om de UID van dat blok te kopiëren.

![Copy UID from block settings](https://static-docs.nocobase.com/block-reference-copy-uid-20251102.png)

## Modi en gedrag
- `Referentie` (standaard)
  - Deelt dezelfde configuratie als het originele blok; wijzigingen aan het originele blok of aan een van de referentiepunten worden in alle referenties gesynchroniseerd.

- `Kopiëren`
  - Genereert een onafhankelijk blok dat op dat moment identiek is aan het originele blok; latere wijzigingen beïnvloeden elkaar niet en worden niet gesynchroniseerd.

## Configuratie
- Referentieblok:
  - `Referentieblokinstellingen`: hier stelt u de UID van het doelblok in en kiest u de modus 'Referentie' of 'Kopiëren';
  - Tegelijkertijd worden de volledige instellingen van het gerefereerde blok zelf weergegeven (wat overeenkomt met het direct configureren van het originele blok).

![Reference block settings](https://static-docs.nocobase.com/block-reference-settings-20251102.png)

- Gekopieerd blok:
  - Het na kopiëren verkregen blok heeft hetzelfde type als het originele blok en bevat alleen de eigen instellingen;
  - Het bevat geen 'Referentieblokinstellingen' meer.

## Fout- en terugvalstatussen
- Bij een ongeldig of ontbrekend doel: er wordt een foutmelding weergegeven. U kunt dit herstellen door de Blok UID opnieuw op te geven in de instellingen van het Referentieblok (Referentieblokinstellingen → Blok UID) en vervolgens op te slaan.  

![Error state when target block is invalid](https://static-docs.nocobase.com/block-reference-error-20251102.png)

## Opmerkingen en beperkingen
- Experimentele functie — wees voorzichtig met gebruik in een productieomgeving.
- Bij het kopiëren moeten sommige configuraties die afhankelijk zijn van de doel-UID mogelijk opnieuw worden geconfigureerd.
- Alle configuraties van een gerefereerd blok worden automatisch gesynchroniseerd, inclusief de 'gegevensbereik'-instellingen. Een gerefereerd blok kan echter zijn eigen [event flow-configuratie](/interface-builder/event-flow/) hebben. Met event flows en aangepaste JavaScript-acties kunt u indirect verschillende gegevensbereiken of gerelateerde configuraties per referentie realiseren.