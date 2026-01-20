:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Eén-op-veel

De relatie tussen een klas en haar studenten is een voorbeeld van een één-op-veel-relatie: één klas kan meerdere studenten hebben, maar elke student behoort slechts tot één klas.

ER-diagram:

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Veldconfiguratie:

![alt text](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Parameterbeschrijving

### Broncollectie

De broncollectie is de collectie waarin het huidige veld zich bevindt.

### Doelcollectie

De doelcollectie is de collectie waarmee u een koppeling wilt maken.

### Bronsleutel

Het veld in de broncollectie waarnaar de vreemde sleutel verwijst. Dit veld moet uniek zijn.

### Vreemde sleutel

Het veld in de doelcollectie dat wordt gebruikt om de koppeling tussen de twee collecties tot stand te brengen.

### Doelsleutel

Het veld in de doelcollectie dat wordt gebruikt om elke rijrecord in het relatieblok te bekijken, meestal een uniek veld.

### ON DELETE

ON DELETE verwijst naar de regels die worden toegepast op vreemde sleutelverwijzingen in gerelateerde onderliggende collecties wanneer records in de bovenliggende collectie worden verwijderd. Het is een optie die wordt gebruikt bij het definiëren van een vreemde sleutelbeperking. Veelvoorkomende ON DELETE-opties zijn:

- **CASCADE**: Wanneer een record in de bovenliggende collectie wordt verwijderd, worden alle gerelateerde records in de onderliggende collectie automatisch verwijderd.
- **SET NULL**: Wanneer een record in de bovenliggende collectie wordt verwijderd, worden de vreemde sleutelwaarden in de gerelateerde records van de onderliggende collectie ingesteld op NULL.
- **RESTRICT**: De standaardoptie. Deze voorkomt het verwijderen van een record in de bovenliggende collectie als er gerelateerde records in de onderliggende collectie aanwezig zijn.
- **NO ACTION**: Vergelijkbaar met RESTRICT. Deze voorkomt het verwijderen van een record in de bovenliggende collectie als er gerelateerde records in de onderliggende collectie aanwezig zijn.