---
pkg: "@nocobase/plugin-ai"
verouderd: true
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Geavanceerd

## Introductie

In de AI-medewerker plugin kunt u gegevensbronnen configureren en vooraf enkele collectiequery's instellen. Deze worden vervolgens als applicatiecontext meegestuurd tijdens gesprekken met de AI-medewerker, die vragen beantwoordt op basis van de resultaten van deze collectiequery's.

## Gegevensbron configureren

Ga naar de configuratiepagina van de AI-medewerker plugin en klik op het tabblad `Data source` om de beheerpagina voor AI-medewerker gegevensbronnen te openen.

![20251022103526](https://static-docs.nocobase.com/20251022103526.png)

Klik op de knop `Add data source` om de pagina voor het aanmaken van een gegevensbron te openen.

Stap 1: Voer de basisinformatie voor de `collectie` in:
- Voer in het invoerveld `Title` een gemakkelijk te onthouden naam in voor de gegevensbron;
- Selecteer in het invoerveld `Collection` de te gebruiken gegevensbron en collectie;
- Voer in het invoerveld `Description` een beschrijving in voor de gegevensbron.
- Voer in het invoerveld `Limit` de querylimiet voor de gegevensbron in. Dit voorkomt dat er te veel gegevens worden geretourneerd, wat de context van het AI-gesprek zou kunnen overschrijden.

![20251022103935](https://static-docs.nocobase.com/20251022103935.png)

Stap 2: Selecteer de te bevragen velden:

Vink in de lijst `Fields` de velden aan die u wilt bevragen.

![20251022104516](https://static-docs.nocobase.com/20251022104516.png)

Stap 3: Stel queryvoorwaarden in:

![20251022104635](https://static-docs.nocobase.com/20251022104635.png)

Stap 4: Stel sorteervoorwaarden in:

![20251022104722](https://static-docs.nocobase.com/20251022104722.png)

Tot slot kunt u, voordat u de gegevensbron opslaat, de queryresultaten van de gegevensbron bekijken.

![20251022105012](https://static-docs.nocobase.com/20251022105012.png)

## Gegevensbronnen versturen in gesprekken

In het dialoogvenster van de AI-medewerker klikt u op de knop `Add work context` linksonder, selecteert u `Data source`, en ziet u de zojuist toegevoegde gegevensbronnen.

![20251022105240](https://static-docs.nocobase.com/20251022105240.png)

Vink de gegevensbron aan die u wilt versturen; de geselecteerde gegevensbron wordt dan aan het dialoogvenster toegevoegd.

![20251022105401](https://static-docs.nocobase.com/20251022105401.png)

Nadat u uw vraag hebt ingevoerd, klikt u, net als bij het versturen van een gewoon bericht, op de verzendknop, en de AI-medewerker zal antwoorden op basis van de gegevensbron.

De gegevensbron verschijnt ook in de berichtenlijst.

![20251022105611](https://static-docs.nocobase.com/20251022105611.png)

## Opmerkingen

De gegevensbron filtert automatisch gegevens op basis van de ACL-rechten van de huidige gebruiker en toont alleen de gegevens waartoe de gebruiker toegang heeft.