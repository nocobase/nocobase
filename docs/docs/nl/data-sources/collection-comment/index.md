---
pkg: "@nocobase/plugin-comments"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Collectie voor opmerkingen

## Introductie

Een collectie voor opmerkingen is een gespecialiseerd sjabloon voor gegevenscollecties, ontworpen voor het opslaan van gebruikersopmerkingen en feedback. Met deze functie kunt u commentaarfunctionaliteit toevoegen aan elke gegevenscollectie, zodat gebruikers specifieke records kunnen bespreken, feedback kunnen geven of annoteren. De collectie voor opmerkingen ondersteunt rich text-bewerking en biedt flexibele mogelijkheden voor contentcreatie.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Functies

- **Rich text-bewerking**: Bevat standaard de Markdown (vditor) editor, ter ondersteuning van rich text-contentcreatie.
- **Koppelen aan elke gegevenscollectie**: U kunt opmerkingen koppelen aan records in elke gegevenscollectie via relatievelden.
- **Opmerkingen met meerdere niveaus**: Ondersteunt het beantwoorden van opmerkingen, waardoor een boomstructuur voor opmerkingen wordt opgebouwd.
- **Gebruikerstracking**: Registreert automatisch de maker van de opmerking en het aanmaaktijdstip.

## Gebruikershandleiding

### Een collectie voor opmerkingen aanmaken

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

1. Ga naar de pagina voor gegevenscollectiebeheer.
2. Klik op de knop "Collectie aanmaken".
3. Selecteer het sjabloon "Collectie voor opmerkingen".
4. Voer de collectienaam in (bijv. "Taakopmerkingen", "Artikelopmerkingen", enz.).
5. Het systeem maakt automatisch een collectie voor opmerkingen aan met de volgende standaardvelden:
   - Inhoud opmerking (Markdown vditor type)
   - Aangemaakt door (gekoppeld aan gebruikerscollectie)
   - Aangemaakt op (datum/tijd type)

### Relaties configureren

Om opmerkingen te kunnen koppelen aan een doelgegevenscollectie, moet u relatievelden configureren:

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

1. Voeg een "Veel-op-één" relatieveld toe in de collectie voor opmerkingen.
2. Selecteer de doelgegevenscollectie waaraan u wilt koppelen (bijv. taken collectie, artikelen collectie, enz.).
3. Stel de veldnaam in (bijv. "Behoort tot taak", "Behoort tot artikel", enz.).

### Opmerkingenblokken gebruiken op pagina's

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

1. Ga naar de pagina waar u commentaarfunctionaliteit wilt toevoegen.
2. Voeg een blok toe in de details of pop-up van de doelrecord.
3. Selecteer het bloktype "Opmerkingen".
4. Kies de collectie voor opmerkingen die u zojuist hebt aangemaakt.

### Typische gebruiksscenario's

- **Taakbeheersystemen**: Teamleden bespreken taken en geven feedback.
- **Contentmanagementsystemen**: Lezers geven commentaar op artikelen en interacteren ermee.
- **Goedkeuringsworkflows**: Goedkeurders annoteren aanvraagformulieren en geven hun mening.
- **Klantfeedback**: Verzamel klantbeoordelingen van producten of diensten.

## Aandachtspunten

- De collectie voor opmerkingen is een commerciële plugin-functie en vereist dat de opmerkingen-plugin is ingeschakeld.
- Het wordt aanbevolen om de juiste rechten in te stellen voor de collectie voor opmerkingen, om te bepalen wie opmerkingen kan bekijken, aanmaken en verwijderen.
- Voor scenario's met een groot aantal opmerkingen wordt aanbevolen om paginering in te schakelen voor betere prestaties.