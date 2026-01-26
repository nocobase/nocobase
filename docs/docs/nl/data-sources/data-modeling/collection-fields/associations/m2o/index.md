:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Veel-op-één

In een bibliotheekdatabase zijn er twee entiteiten: boeken en auteurs. Een auteur kan meerdere boeken schrijven, maar elk boek heeft meestal maar één auteur. In zo'n geval is de relatie tussen auteurs en boeken een veel-op-één relatie. Meerdere boeken kunnen aan dezelfde auteur gekoppeld zijn, maar elk boek kan slechts één auteur hebben.

ER-diagram:

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Veldconfiguratie:

![alt text](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Parameterbeschrijving

### Broncollectie

De broncollectie, oftewel de collectie waarin het huidige veld zich bevindt.

### Doelcollectie

De doelcollectie, oftewel de collectie waarmee de koppeling wordt gemaakt.

### Foreign Key

Het veld in de broncollectie dat wordt gebruikt om de koppeling tussen de twee collecties tot stand te brengen.

### Doelsleutel

Het veld in de doelcollectie waarnaar de foreign key verwijst. Dit veld moet uniek zijn.

### ON DELETE

ON DELETE verwijst naar de regels die worden toegepast op foreign key-verwijzingen in gerelateerde onderliggende collecties wanneer records in de bovenliggende collectie worden verwijderd. Het is een optie die wordt gebruikt bij het definiëren van een foreign key-constraint. Veelvoorkomende ON DELETE-opties zijn:

- **CASCADE**: Wanneer een record in de bovenliggende collectie wordt verwijderd, worden alle gerelateerde records in de onderliggende collectie automatisch verwijderd.
- **SET NULL**: Wanneer een record in de bovenliggende collectie wordt verwijderd, worden de foreign key-waarden in de gerelateerde records van de onderliggende collectie ingesteld op NULL.
- **RESTRICT**: De standaardoptie: voorkomt het verwijderen van een record in de bovenliggende collectie als er gerelateerde records in de onderliggende collectie zijn.
- **NO ACTION**: Vergelijkbaar met RESTRICT: voorkomt het verwijderen van een record in de bovenliggende collectie als er gerelateerde records in de onderliggende collectie zijn.