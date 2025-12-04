:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Veel-op-veel

In een systeem voor cursusinschrijvingen zijn er twee entiteiten: studenten en cursussen. Een student kan zich inschrijven voor meerdere cursussen, en een cursus kan meerdere ingeschreven studenten hebben. Dit vormt een veel-op-veel relatie. In een relationele database wordt voor het weergeven van een veel-op-veel relatie tussen studenten en cursussen meestal een tussenliggende `collectie` gebruikt, zoals een inschrijvings`collectie`. Deze `collectie` kan bijhouden welke cursussen elke student heeft gekozen en welke studenten zich voor elke cursus hebben ingeschreven. Dit ontwerp is een effectieve manier om de veel-op-veel relatie tussen studenten en cursussen weer te geven.

ER-diagram:

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Veldconfiguratie:

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Parameterbeschrijving

### Source collectie
De bron`collectie`, oftewel de `collectie` waarin het huidige veld zich bevindt.

### Target collectie
De doel`collectie`, oftewel de `collectie` waarmee u een koppeling wilt maken.

### Through collectie (Tussenliggende collectie)
De tussenliggende `collectie` wordt gebruikt wanneer er een veel-op-veel relatie bestaat tussen twee entiteiten. Deze `collectie` heeft twee foreign keys (vreemde sleutels) die de koppeling tussen de twee entiteiten onderhouden.

### Source key
Het veld in de bron`collectie` waarnaar de foreign key (vreemde sleutel) verwijst. Dit veld moet uniek zijn.

### Foreign key 1
Het veld in de tussenliggende `collectie` dat de koppeling met de bron`collectie` tot stand brengt.

### Foreign key 2
Het veld in de tussenliggende `collectie` dat de koppeling met de doel`collectie` tot stand brengt.

### Target key
Het veld in de doel`collectie` waarnaar de foreign key (vreemde sleutel) verwijst. Dit veld moet uniek zijn.

### ON DELETE
`ON DELETE` verwijst naar de regels die worden toegepast op foreign key (vreemde sleutel) verwijzingen in gerelateerde onderliggende `collecties` wanneer records in de bovenliggende `collectie` worden verwijderd. Het is een optie die wordt gebruikt bij het definiëren van een foreign key-constraint. Veelvoorkomende `ON DELETE`-opties zijn:

- **CASCADE**: Wanneer een record in de bovenliggende `collectie` wordt verwijderd, worden alle gerelateerde records in de onderliggende `collectie` automatisch verwijderd.
- **SET NULL**: Wanneer een record in de bovenliggende `collectie` wordt verwijderd, worden de foreign key-waarden in de gerelateerde records van de onderliggende `collectie` ingesteld op `NULL`.
- **RESTRICT**: De standaardoptie. Deze voorkomt het verwijderen van een record in de bovenliggende `collectie` als er gerelateerde records in de onderliggende `collectie` aanwezig zijn.
- **NO ACTION**: Vergelijkbaar met `RESTRICT`. Deze voorkomt het verwijderen van een record in de bovenliggende `collectie` als er gerelateerde records in de onderliggende `collectie` aanwezig zijn.