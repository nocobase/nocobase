:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Eén-op-één

In de relatie tussen medewerkers en persoonlijke profielen kan elke medewerker slechts één persoonlijk profiel hebben, en elk persoonlijk profiel kan slechts aan één medewerker gekoppeld zijn. In zo'n geval spreken we van een één-op-één relatie tussen de medewerker en het persoonlijke profiel.

De foreign key in een één-op-één relatie kunt u zowel in de broncollectie als in de doelcollectie plaatsen. Als het een 'heeft één' relatie betreft, is het geschikter om de foreign key in de doelcollectie te plaatsen. Als het daarentegen een 'behoort tot' relatie is, dan past de foreign key beter in de broncollectie.

Neem bijvoorbeeld het bovengenoemde scenario: een medewerker heeft één persoonlijk profiel, en dit profiel behoort toe aan de medewerker. In dit geval is het logisch om de foreign key in de collectie van persoonlijke profielen te plaatsen.

## Eén-op-één (Heeft één)

Dit geeft aan dat een medewerker één persoonlijk profiel heeft.

ER Relatie

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Veldconfiguratie

![alt text](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## Eén-op-één (Behoort tot)

Dit geeft aan dat een persoonlijk profiel behoort tot een specifieke medewerker.

ER Relatie

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Veldconfiguratie

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a34942da43c187c.png)

## Parameterbeschrijvingen

### Source collection

De broncollectie, oftewel de collectie waarin het huidige veld zich bevindt.

### Target collection

De doelcollectie, de collectie waarmee de relatie wordt gelegd.

### Foreign key

Wordt gebruikt om een relatie tussen twee collecties tot stand te brengen. In een één-op-één relatie kunt u de foreign key zowel in de broncollectie als in de doelcollectie plaatsen. Als het een 'heeft één' relatie betreft, is het geschikter om de foreign key in de doelcollectie te plaatsen; als het daarentegen een 'behoort tot' relatie is, dan past de foreign key beter in de broncollectie.

### Source key <- Foreign key (Foreign key in de doelcollectie)

Het veld waarnaar de foreign key-constraint verwijst, moet uniek zijn. Wanneer de foreign key in de doelcollectie wordt geplaatst, duidt dit op een 'heeft één' relatie.

### Target key <- Foreign key (Foreign key in de broncollectie)

Het veld waarnaar de foreign key-constraint verwijst, moet uniek zijn. Wanneer de foreign key in de broncollectie wordt geplaatst, duidt dit op een 'behoort tot' relatie.

### ON DELETE

ON DELETE verwijst naar de regels voor de foreign key-referentie in de gerelateerde onderliggende collectie wanneer records uit de bovenliggende collectie worden verwijderd. Het is een optie die wordt gedefinieerd bij het opzetten van een foreign key-constraint. Veelvoorkomende ON DELETE-opties zijn:

- CASCADE: Wanneer een record in de bovenliggende collectie wordt verwijderd, worden automatisch alle gerelateerde records in de onderliggende collectie verwijderd.
- SET NULL: Wanneer een record in de bovenliggende collectie wordt verwijderd, wordt de foreign key-waarde in de gerelateerde onderliggende collectie ingesteld op NULL.
- RESTRICT: De standaardoptie, waarbij het verwijderen van een record uit de bovenliggende collectie wordt geweigerd als er gerelateerde records in de onderliggende collectie aanwezig zijn.
- NO ACTION: Vergelijkbaar met RESTRICT; het verwijderen van een record uit de bovenliggende collectie wordt geweigerd als er gerelateerde records in de onderliggende collectie aanwezig zijn.