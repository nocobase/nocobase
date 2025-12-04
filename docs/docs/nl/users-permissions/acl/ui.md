---
pkg: '@nocobase/plugin-acl'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Toepassing in de UI

## Rechten voor datablokken

De zichtbaarheid van datablokken in een collectie wordt bepaald door de 'bekijken'-actierechten. Individuele configuraties hebben hierbij voorrang op globale instellingen.

Zo heeft de rol "admin" onder de globale rechten volledige toegang, maar kan de collectie 'Bestellingen' individueel geconfigureerde rechten hebben die deze onzichtbaar maken.

Globale rechtenconfiguratie:

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

Individuele rechtenconfiguratie voor de collectie 'Bestellingen':

![](https://static-docs.nocobase.com/a88caba1cad47001c1610bf402a4a2c1.png)

In de UI worden alle blokken van de collectie 'Bestellingen' niet weergegeven.

Het volledige configuratieproces ziet er als volgt uit:

![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)

## Veldrechten

**Bekijken**: Bepaalt of specifieke velden zichtbaar zijn op veldniveau. Hiermee kunt u bijvoorbeeld instellen welke velden van de collectie 'Bestellingen' zichtbaar zijn voor bepaalde rollen.

![](https://static-docs.nocobase.com/30dea84d84d95039e6f7b180955a6cf.png)

In de UI worden in het blok van de collectie 'Bestellingen' alleen velden weergegeven waarvoor rechten zijn geconfigureerd. Systeemvelden (Id, CreatedAt, LastUpdatedAt) behouden hun 'bekijken'-rechten, zelfs zonder specifieke configuratie.

![](https://static-docs.nocobase.com/40cc4717efe701147fd2e799e79dcc.png)

- **Bewerken**: Bepaalt of velden bewerkt en opgeslagen (bijgewerkt) kunnen worden.

  Configureer de bewerkrechten voor velden van de collectie 'Bestellingen' (aantal en gerelateerde artikelen hebben bewerkrechten):

  ![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)

  In de UI worden in het bewerkingsformulierblok van de collectie 'Bestellingen' alleen velden weergegeven waarvoor bewerkrechten zijn ingesteld.

  ![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

  Het volledige configuratieproces ziet er als volgt uit:

  ![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)

- **Toevoegen**: Bepaalt of velden toegevoegd (aangemaakt) kunnen worden.

  Configureer de toevoegrechten voor velden van de collectie 'Bestellingen' (bestelnummer, aantal, artikelen en verzending hebben toevoegrechten):

  ![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

  In de UI worden in het toevoegingsformulierblok van de collectie 'Bestellingen' alleen velden weergegeven waarvoor toevoegrechten zijn ingesteld.

  ![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- **Exporteren**: Bepaalt of velden geëxporteerd kunnen worden.
- **Importeren**: Bepaalt of velden geïmporteerd kunnen worden.

## Actierechten

Individueel geconfigureerde rechten hebben de hoogste prioriteit. Als er specifieke rechten zijn geconfigureerd, overschrijven deze de globale instellingen; anders worden de globale instellingen toegepast.

- **Toevoegen**: Bepaalt of de knop voor de 'toevoegen'-actie zichtbaar is binnen een blok.

  Configureer individuele actierechten voor de collectie 'Bestellingen' om toevoegen toe te staan:

  ![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

  Wanneer de 'toevoegen'-actie is toegestaan, verschijnt de toevoegknop in het actiegebied van het blok van de collectie 'Bestellingen' in de UI.

  ![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- **Bekijken**: Bepaalt of het datablok zichtbaar is.

  Globale rechtenconfiguratie (geen 'bekijken'-rechten):

  ![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

  Individuele rechtenconfiguratie voor de collectie 'Bestellingen':

  ![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

  In de UI blijven de datablokken voor alle andere collecties verborgen, maar wordt het blok van de collectie 'Bestellingen' wel weergegeven.

  Het volledige voorbeeldconfiguratieproces ziet er als volgt uit:

  ![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- **Bewerken**: Bepaalt of de knop voor de 'bewerken'-actie zichtbaar is binnen een blok.

  ![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

  Actierechten kunnen verder worden verfijnd door het databereik in te stellen.

  U kunt bijvoorbeeld instellen dat gebruikers in de collectie 'Bestellingen' alleen hun eigen gegevens kunnen bewerken:

  ![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- **Verwijderen**: Bepaalt of de knop voor de 'verwijderen'-actie zichtbaar is binnen een blok.

  ![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- **Exporteren**: Bepaalt of de knop voor de 'exporteren'-actie zichtbaar is binnen een blok.

- **Importeren**: Bepaalt of de knop voor de 'importeren'-actie zichtbaar is binnen een blok.

## Relatierechten

### Als veld

- De rechten van een relatieveld worden beheerd door de veldrechten van de broncollectie. Dit bepaalt of het gehele relatieveldcomponent wordt weergegeven.

Zo heeft in de collectie 'Bestellingen' het relatieveld "Klant" alleen 'bekijken'-, 'importeren'- en 'exporteren'-rechten.

![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

In de UI betekent dit dat het relatieveld "Klant" niet wordt weergegeven in de 'toevoegen'- en 'bewerken'-actieblokken van de collectie 'Bestellingen'.

Het volledige voorbeeldconfiguratieproces ziet er als volgt uit:

![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- De rechten voor velden binnen het relatieveldcomponent (zoals een subtabel of subformulier) worden bepaald door de rechten van de doelcollectie.

Wanneer het relatieveldcomponent een subformulier is:

Zoals hieronder getoond, heeft het relatieveld "Klant" in de collectie 'Bestellingen' alle rechten, terwijl de collectie 'Klanten' zelf is ingesteld op alleen-lezen.

Individuele rechtenconfiguratie voor de collectie 'Bestellingen', waarbij het relatieveld "Klant" alle veldrechten heeft:

![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)

Individuele rechtenconfiguratie voor de collectie 'Klanten', waarbij velden alleen 'bekijken'-rechten hebben:

![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

In de UI is het relatieveld "Klant" zichtbaar in het blok van de collectie 'Bestellingen'. Echter, wanneer u overschakelt naar een subformulier, zijn de velden binnen het subformulier zichtbaar in de detailweergave, maar worden ze niet weergegeven bij de 'toevoegen'- en 'bewerken'-acties.

Het volledige voorbeeldconfiguratieproces ziet er als volgt uit:

![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

Om de rechten voor velden binnen het subformulier verder te beheren, kunt u rechten toekennen aan individuele velden.

Zoals getoond, is de collectie 'Klanten' geconfigureerd met individuele veldrechten (klantnaam is niet zichtbaar en niet bewerkbaar).

![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

Het volledige voorbeeldconfiguratieproces ziet er als volgt uit:

![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

Wanneer het relatieveldcomponent een subtabel is, is de situatie consistent met die van een subformulier:

Zoals getoond, heeft het relatieveld "Verzending" in de collectie 'Bestellingen' alle rechten, terwijl de collectie 'Verzendingen' is ingesteld op alleen-lezen.

In de UI is dit relatieveld zichtbaar. Echter, wanneer u overschakelt naar een subtabel, zijn de velden binnen de subtabel zichtbaar bij de 'bekijken'-actie, maar niet bij de 'toevoegen'- en 'bewerken'-acties.

![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

Om de rechten voor velden binnen de subtabel verder te beheren, kunt u rechten toekennen aan individuele velden:

![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

### Als blok

- De zichtbaarheid van een relatieblok wordt bepaald door de rechten van de doelcollectie van het corresponderende relatieveld, en is onafhankelijk van de rechten van het relatieveld zelf.

Zo wordt de weergave van het relatieblok "Klant" bepaald door de rechten van de collectie 'Klanten'.

![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- De velden binnen een relatieblok worden beheerd door de veldrechten in de doelcollectie.

Zoals getoond, kunt u 'bekijken'-rechten instellen voor individuele velden in de collectie 'Klanten'.

![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)