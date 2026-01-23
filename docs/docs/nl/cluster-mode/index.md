:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Clustermodus

## Introductie

Vanaf versie v1.6.0 ondersteunt NocoBase het draaien van applicaties in clustermodus. Wanneer een applicatie in clustermodus draait, verbetert u de prestaties bij het verwerken van gelijktijdige toegang. Dit wordt bereikt door het inzetten van meerdere instanties en een multi-core modus.

## Systeemarchitectuur

![20251031221530](https://static-docs.nocobase.com/20251031221530.png)

*   **Applicatiecluster**: Een cluster dat bestaat uit meerdere NocoBase applicatie-instanties. U kunt dit implementeren op meerdere servers, of meerdere processen in multi-core modus draaien op één server.
*   **Database**: Slaat de gegevens van de applicatie op. Dit kan een single-node of een gedistribueerde database zijn.
*   **Gedeelde opslag**: Wordt gebruikt om applicatiebestanden en gegevens op te slaan, en ondersteunt lees-/schrijftoegang vanuit meerdere instanties.
*   **Middleware**: Omvat componenten zoals cache, synchronisatiesignalen, berichtenwachtrijen en gedistribueerde locks, ter ondersteuning van de communicatie en coördinatie binnen het applicatiecluster.
*   **Load Balancer**: Verantwoordelijk voor het verdelen van clientverzoeken over verschillende instanties in het applicatiecluster, en voor het uitvoeren van health checks en failover.

## Meer informatie

Dit document introduceert alleen de basisconcepten en componenten van de NocoBase clustermodus. Voor specifieke implementatiedetails en meer configuratieopties, kunt u de volgende documenten raadplegen:

- Implementatie
  - [Voorbereidingen](./preparations)
  - [Kubernetes Implementatie](./kubernetes)
  - [Operationele processen](./operations)
- Geavanceerd
  - [Service Splitsing](./services-splitting)
- [Ontwikkelingsreferentie](./development)