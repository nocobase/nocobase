---
pkg: "@nocobase/plugin-ui-templates"
---

:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/interface-builder/ui-templates) voor nauwkeurige informatie.
:::

# UI-sjablonen

## Inleiding

UI-sjablonen worden gebruikt om configuraties in de interfacebouw te hergebruiken. Dit vermindert herhalende handelingen en zorgt ervoor dat configuraties op meerdere plaatsen synchroon bijgewerkt kunnen worden wanneer dat nodig is.

De momenteel ondersteunde sjabloontypen zijn:

- **Bloksjabloon**: Hergebruik van volledige blokconfiguraties.
- **Veldsjabloon**: Hergebruik van de configuratie van het "veldgedeelte" in formulier- of detailblokken.
- **Pop-upsjabloon**: Hergebruik van pop-upconfiguraties die worden geactiveerd door acties of velden.

## Kernconcepten

### Referentie en kopiëren

Er zijn doorgaans twee manieren om sjablonen te gebruiken:

- **Referentie**: Meerdere plaatsen delen dezelfde sjabloonconfiguratie. Als u het sjabloon of een referentiepunt wijzigt, worden de updates gesynchroniseerd naar alle andere referentiepunten.
- **Kopiëren**: Kopiëren als een onafhankelijke configuratie. Latere wijzigingen hebben geen invloed op elkaar.

### Opslaan als sjabloon

Wanneer een blok of pop-up al is geconfigureerd, kunt u in het instellingenmenu kiezen voor `Opslaan als sjabloon` en de opslagmethode selecteren:

- **Huidige... omzetten naar sjabloon**: Na het opslaan schakelt de huidige positie over naar een referentie naar dat sjabloon.
- **Huidige... kopiëren als sjabloon**: Alleen het sjabloon wordt aangemaakt; de huidige positie blijft ongewijzigd.

## Bloksjabloon

### Blok opslaan als sjabloon

1) Open het instellingenmenu van het doelblok en klik op `Opslaan als sjabloon`.  
2) Vul de `Sjabloonnaam` en `Sjabloonbeschrijving` in en kies de opslagmodus:
   - **Huidig blok omzetten naar sjabloon**: Na het opslaan wordt de huidige positie vervangen door een `Bloksjabloon`-blok (dat verwijst naar dat sjabloon).
   - **Huidig blok kopiëren als sjabloon**: Alleen het sjabloon wordt aangemaakt; het huidige blok blijft ongewijzigd.

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

### Bloksjabloon gebruiken

1) Blok toevoegen → "Overige blokken" → `Bloksjabloon`.  
2) Selecteer in de configuratie:
   - **Sjabloon**: Kies een sjabloon.
   - **Modus**: `Referentie` of `Kopiëren`.

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Referentie omzetten naar kopie

Wanneer een blok naar een sjabloon verwijst, kunt u in het instellingenmenu van het blok de optie `Referentie omzetten naar kopie` gebruiken. Hiermee verandert u het huidige blok in een regulier blok (de referentie wordt verbroken), zodat latere wijzigingen geen invloed meer hebben op het sjabloon.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

### Opmerkingen

- De modus `Kopiëren` genereert nieuwe UID's voor het blok en de onderliggende knooppunten. Sommige configuraties die afhankelijk zijn van UID's moeten mogelijk opnieuw worden geconfigureerd.

## Veldsjabloon

Veldsjablonen worden gebruikt om de configuratie van veldgedeelten (veldselectie, lay-out en veldinstellingen) te hergebruiken in **formulierblokken** en **detailblokken**. Dit voorkomt dat u herhaaldelijk velden moet toevoegen op meerdere pagina's of blokken.

> Veldsjablonen hebben alleen invloed op het "veldgedeelte" en vervangen niet het hele blok. Gebruik het hierboven beschreven bloksjabloon om een volledig blok te hergebruiken.

### Veldsjablonen gebruiken in formulier-/detailblokken

1) Activeer de configuratiemodus en open het menu "Velden" in een formulier- of detailblok.  
2) Selecteer `Veldsjabloon`.  
3) Kies een sjabloon en selecteer de modus: `Referentie` of `Kopiëren`.

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

#### Overschrijvingswaarschuwing

Wanneer er al velden in het blok aanwezig zijn, zal het gebruik van de **Referentie**-modus meestal om een bevestiging vragen (omdat de gerefereerde velden het huidige veldgedeelte zullen vervangen).

### Gerefereerde velden omzetten naar kopie

Wanneer een blok naar een veldsjabloon verwijst, kunt u in het instellingenmenu van het blok de optie `Gerefereerde velden omzetten naar kopie` gebruiken om van het huidige veldgedeelte een onafhankelijke configuratie te maken.

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

### Opmerkingen

- Veldsjablonen zijn alleen van toepassing op **formulierblokken** en **detailblokken**.
- Wanneer het sjabloon en het huidige blok aan verschillende gegevensbron-tabellen zijn gekoppeld, wordt het sjabloon als onbeschikbaar weergegeven in de kiezer met de reden erbij.
- Als u "gepersonaliseerde aanpassingen" wilt maken aan velden in het huidige blok, raden we aan direct de modus `Kopiëren` te gebruiken of eerst "Gerefereerde velden omzetten naar kopie" uit te voeren.

## Pop-upsjabloon

Pop-upsjablonen worden gebruikt om een set pop-upinterfaces en interactielogica te hergebruiken. Voor algemene configuraties zoals de wijze van openen en de grootte van de pop-up, raadpleegt u [Pop-up bewerken](/interface-builder/actions/action-settings/edit-popup).

### Pop-up opslaan als sjabloon

1) Open het instellingenmenu van een knop of veld dat een pop-up kan activeren en klik op `Opslaan als sjabloon`.  
2) Vul de sjabloonnaam en beschrijving in en kies de opslagmodus:
   - **Huidige pop-up omzetten naar sjabloon**: Na het opslaan zal de huidige pop-up verwijzen naar dit sjabloon.
   - **Huidige pop-up kopiëren als sjabloon**: Alleen het sjabloon wordt aangemaakt; de huidige pop-up blijft ongewijzigd.

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Sjabloon gebruiken in pop-upconfiguratie

1) Open de pop-upconfiguratie van de knop of het veld.  
2) Selecteer een sjabloon bij `Pop-upsjabloon` om deze te hergebruiken.

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Gebruiksvoorwaarden (beschikbaarheidsbereik van sjablonen)

Pop-upsjablonen zijn gerelateerd aan het actiescenario dat de pop-up activeert. De kiezer filtert of deactiveert automatisch incompatibele sjablonen op basis van het huidige scenario.

| Huidig actietype | Beschikbare pop-upsjablonen |
| --- | --- |
| **Collectie-actie** | Pop-upsjablonen gemaakt door collectie-acties van dezelfde collectie. |
| **Niet-geassocieerde record-actie** | Pop-upsjablonen gemaakt door collectie-acties of niet-geassocieerde record-acties van dezelfde collectie. |
| **Geassocieerde record-actie** | Pop-upsjablonen gemaakt door collectie-acties of niet-geassocieerde record-acties van dezelfde collectie; of pop-upsjablonen gemaakt door geassocieerde record-acties van hetzelfde relatieveld. |

### Pop-ups voor relatiegegevens

Pop-ups die worden geactiveerd door relatiegegevens (relatievelden) hebben speciale regels voor overeenkomsten:

#### Strikte overeenkomst voor relatie-pop-upsjablonen

Wanneer een pop-upsjabloon is gemaakt op basis van een **geassocieerde record-actie** (het sjabloon heeft een `associationName`), kan dat sjabloon alleen worden gebruikt door acties of velden met **exact hetzelfde relatieveld**.

Bijvoorbeeld: een pop-upsjabloon gemaakt op het relatieveld `Bestelling.Klant` kan alleen worden gebruikt door andere acties van het relatieveld `Bestelling.Klant`. Het kan niet worden gebruikt door het relatieveld `Bestelling.Referent` (zelfs als beide verwijzen naar de collectie `Klanten`).

Dit komt omdat de interne variabelen en configuraties van relatie-pop-upsjablonen afhankelijk zijn van de specifieke context van de relatie.

#### Relatie-acties die sjablonen van de doelcollectie hergebruiken

Relatievelden of -acties kunnen **niet-geassocieerde pop-upsjablonen van de doelcollectie** hergebruiken (sjablonen gemaakt door collectie-acties of niet-geassocieerde record-acties), zolang de collectie overeenkomt.

Bijvoorbeeld: het relatieveld `Bestelling.Klant` kan pop-upsjablonen van de collectie `Klanten` gebruiken. Deze aanpak is geschikt voor het delen van dezelfde pop-upconfiguratie over meerdere relatievelden (zoals een uniform scherm voor klantdetails).

### Referentie omzetten naar kopie

Wanneer een pop-up naar een sjabloon verwijst, kunt u in het instellingenmenu de optie `Referentie omzetten naar kopie` gebruiken om van de huidige pop-up een onafhankelijke configuratie te maken.

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)


## Sjabloonbeheer

In Systeeminstellingen → `UI-sjablonen` kunt u alle sjablonen bekijken en beheren:

- **Bloksjablonen (v2)**: Beheer bloksjablonen.
- **Pop-upsjablonen (v2)**: Beheer pop-upsjablonen.

> Veldsjablonen zijn afgeleid van bloksjablonen en worden binnen de bloksjablonen beheerd.

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

Ondersteunde acties: Bekijken, Filteren, Bewerken, Verwijderen.

> **Let op**: Als naar een sjabloon wordt verwezen, kan deze niet direct worden verwijderd. Gebruik eerst `Referentie omzetten naar kopie` op de locaties die naar het sjabloon verwijzen om de referentie te verbreken, en verwijder daarna het sjabloon.