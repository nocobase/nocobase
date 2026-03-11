:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/get-started/system-requirements) voor nauwkeurige informatie.
:::

# Systeemvereisten

De systeemvereisten die in dit document worden beschreven, zijn van toepassing op de **NocoBase-applicatieservice zelf** en omvatten de reken- en geheugenbronnen die nodig zijn voor de applicatieprocessen. Ze omvatten **geen afhankelijke diensten van derden**, inclusief maar niet beperkt tot:

- API-gateways / reverse proxies
- Databaseservices (bijv. MySQL of PostgreSQL)
- Cacheservices (bijv. Redis)
- Middleware zoals berichtenwachtrijen (message queues) of objectopslag

Behalve voor functionele validatie of experimentele scenario's, **raden wij u ten zeerste aan om de bovengenoemde diensten van derden afzonderlijk te implementeren** op speciale servers of containers, of door gebruik te maken van relevante clouddiensten.

De systeemconfiguratie en capaciteitsplanning van deze diensten moeten afzonderlijk worden geëvalueerd en geoptimaliseerd op basis van de **werkelijke gegevensomvang, werklast en mate van gelijktijdigheid**.

## Implementatiemodus op één knooppunt

De implementatiemodus op één knooppunt houdt in dat de NocoBase-applicatieservice op één enkele server of containerinstantie draait.

### Minimale hardwarevereisten

| Bron | Vereiste |
|---|---|
| CPU | 1 core |
| Geheugen | 2 GB |

**Toepasbare scenario's**:

- Micro-ondernemingen
- Proof of Concept (POC)
- Ontwikkelings- / testomgevingen
- Scenario's met vrijwel geen gelijktijdige toegang

:::info{title=Tip}

- Deze configuratie garandeert alleen dat het systeem kan draaien; het garandeert geen prestatie-ervaring.
- Wanneer de hoeveelheid gegevens of het aantal gelijktijdige verzoeken toeneemt, kunnen de systeembronnen snel een knelpunt worden.
- Voor scenario's zoals **ontwikkeling van broncode, ontwikkeling van plugins of het bouwen en implementeren vanaf de broncode**, raden wij aan om **ten minste 4 GB vrij geheugen** te reserveren om ervoor te zorgen dat de installatie van afhankelijkheden, compilatie en het bouwproces succesvol worden voltooid.

:::

### Aanbevolen hardwarevereisten

| Bron | Aanbevolen configuratie |
|---|---|
| CPU | 2 cores |
| Geheugen | ≥ 4 GB |

**Toepasbare scenario's**:

Geschikt voor kleine tot middelgrote ondernemingen en productieomgevingen met een beperkt aantal gelijktijdige gebruikers.

:::info{title=Tip}

- Met deze configuratie kan het systeem reguliere administratieve handelingen en lichte werklasten aan.
- Wanneer de complexiteit van de bedrijfsvoering, de gelijktijdige toegang of het aantal achtergrondtaken toeneemt, moet u overwegen de hardwarespecificaties te upgraden of te migreren naar de clustermodus.

:::

## Clustermodus

De clustermodus is ontworpen voor middelgrote tot grote bedrijfsscenario's met veel gelijktijdige gebruikers. U kunt horizontaal schalen om de beschikbaarheid en doorvoer van het systeem te verbeteren (zie [Clustermodus](/cluster-mode) voor details).

### Hardwarevereisten per knooppunt

In de clustermodus wordt aanbevolen dat de hardwareconfiguratie van elk applicatieknooppunt (Pod / instantie) overeenkomt met die van de implementatiemodus op één knooppunt.

**Minimale configuratie per knooppunt:**

- CPU: 1 core
- Geheugen: 2 GB

**Aanbevolen configuratie per knooppunt:**

- CPU: 2 cores
- Geheugen: 4 GB

### Planning van het aantal knooppunten

- Het aantal knooppunten in het cluster kan naar behoefte worden uitgebreid (2–N).
- Het werkelijk benodigde aantal knooppunten hangt af van:
  - Aantal gelijktijdige toegangen
  - Complexiteit van de bedrijfslogica
  - Belasting door achtergrondtaken en asynchrone verwerking
  - Reactievermogen van externe afhankelijke diensten

Aanbevelingen voor productieomgevingen:

- Pas de omvang van de knooppunten dynamisch aan op basis van monitoringindicatoren (CPU, geheugen, latentie van verzoeken, enz.).
- Reserveer een bepaalde hoeveelheid extra middelen (redundantie) om verkeerspieken op te vangen.