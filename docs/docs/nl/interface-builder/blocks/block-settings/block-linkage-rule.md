:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Blokkoppelingsregels

## Introductie

Blokkoppelingsregels stellen u in staat om de weergave van blokken dynamisch te beheren en zo de presentatie van elementen op blokniveau te regelen. Aangezien blokken fungeren als containers voor velden en actieknoppen, kunt u met deze regels de weergave van de gehele weergave flexibel aanpassen op blokniveau.

![20251029112218](https://static-docs.nocobase.com/20251029112218.png)

![20251029112338](https://static-docs.nocobase.com/20251029112338.png)

> **Let op**: Voordat blokkoppelingsregels worden uitgevoerd, moet de weergave van een blok eerst een **ACL-machtigingscontrole** doorlopen. Alleen wanneer een gebruiker de bijbehorende toegangsrechten heeft, wordt de logica van de blokkoppelingsregels geëvalueerd. Met andere woorden, blokkoppelingsregels worden pas van kracht nadat aan de ACL-weergavemachtigingen is voldaan. Als er geen blokkoppelingsregels zijn, wordt het blok standaard weergegeven.

### Blokken beheren met globale variabelen

**Blokkoppelingsregels** ondersteunen het gebruik van globale variabelen om de inhoud die in blokken wordt weergegeven dynamisch te beheren, zodat gebruikers met verschillende rollen en machtigingen aangepaste gegevensweergaven kunnen zien en ermee kunnen werken. In een orderbeheersysteem hebben bijvoorbeeld verschillende rollen (zoals beheerders, verkoopmedewerkers en financiële medewerkers) allemaal de machtiging om orders te bekijken, maar de velden en actieknoppen die elke rol moet zien, kunnen verschillen. Door globale variabelen te configureren, kunt u de weergegeven velden, actieknoppen en zelfs de sorteer- en filterregels voor gegevens flexibel aanpassen op basis van de rol, machtigingen of andere voorwaarden van de gebruiker.

#### Specifieke toepassingsscenario's:

- **Rol- en machtigingsbeheer**: Beheer de zichtbaarheid of bewerkbaarheid van bepaalde velden op basis van de machtigingen van verschillende rollen. Verkoopmedewerkers kunnen bijvoorbeeld alleen de basisinformatie van een order bekijken, terwijl financiële medewerkers de betalingsdetails kunnen inzien.
- **Gepersonaliseerde weergaven**: Pas verschillende blokweergaven aan voor verschillende afdelingen of teams, zodat elke gebruiker alleen inhoud ziet die relevant is voor zijn of haar werk, wat de efficiëntie verhoogt.
- **Beheer van actiemachtigingen**: Beheer de weergave van actieknoppen met behulp van globale variabelen. Sommige rollen kunnen bijvoorbeeld alleen gegevens bekijken, terwijl andere rollen acties zoals wijzigen of verwijderen kunnen uitvoeren.

### Blokken beheren met contextuele variabelen

Blokken kunnen ook worden beheerd door variabelen in de context. U kunt bijvoorbeeld contextuele variabelen zoals 'Huidige record', 'Huidig formulier' en 'Huidige pop-up record' gebruiken om blokken dynamisch weer te geven of te verbergen.

Voorbeeld: Het blok 'Order Opportunity Information' wordt alleen weergegeven als de orderstatus 'Betaald' is.

![20251029114022](https://static-docs.nocobase.com/20251029114022.png)

Raadpleeg voor meer informatie over koppelingsregels [Koppelingsregels](/interface-builder/linkage-rule).