---
pkg: '@nocobase/plugin-password-policy'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Wachtwoordbeleid

## Introductie

Hier stelt u de wachtwoordregels, de geldigheidsduur van wachtwoorden en het beveiligingsbeleid voor wachtwoordinlog in voor alle gebruikers. U beheert hier ook geblokkeerde gebruikers.

## Wachtwoordregels

![](https://static-docs.nocobase.com/202412281329313.png)

### Minimale wachtwoordlengte

Hier stelt u de minimale lengtevereiste voor wachtwoorden in. De maximale lengte is 64 tekens.

### Vereisten voor wachtwoordcomplexiteit

De volgende opties worden ondersteund:

- Moet letters en cijfers bevatten
- Moet letters, cijfers en symbolen bevatten
- Moet cijfers, hoofdletters en kleine letters bevatten
- Moet cijfers, hoofdletters, kleine letters en symbolen bevatten
- Moet minstens 3 van de volgende tekens bevatten: cijfers, hoofdletters, kleine letters en speciale tekens
- Geen beperkingen

![](https://static-docs.nocobase.com/202412281331649.png)

### Wachtwoord mag geen gebruikersnaam bevatten

U kunt instellen of het wachtwoord de gebruikersnaam van de huidige gebruiker mag bevatten.

### Aantal eerder gebruikte wachtwoorden

Het systeem onthoudt een aantal recentelijk door de gebruiker gebruikte wachtwoorden. Deze wachtwoorden kunnen niet opnieuw worden gebruikt wanneer de gebruiker zijn wachtwoord wijzigt. Een waarde van 0 betekent geen beperking; het maximum is 24.

## Configuratie wachtwoordgeldigheid

![](https://static-docs.nocobase.com/202412281335588.png)

### Geldigheidsduur wachtwoord

De geldigheidsduur van het wachtwoord van de gebruiker. Gebruikers moeten hun wachtwoord wijzigen voordat het verloopt; dan wordt de geldigheidsduur opnieuw berekend. Als het wachtwoord niet vóór de vervaldatum wordt gewijzigd, kunt u niet meer inloggen met het oude wachtwoord en is hulp van een beheerder nodig om het te resetten. Als er andere inlogmethoden zijn geconfigureerd, kunt u deze wel gebruiken om in te loggen.

### Notificatiekanaal voor wachtwoordvervaldatum

Binnen 10 dagen voordat het wachtwoord van een gebruiker verloopt, wordt er bij elke inlogpoging een herinnering verstuurd. Standaard wordt deze herinnering verzonden via het interne berichtkanaal 'Wachtwoordvervalherinnering'. U kunt dit kanaal beheren in de sectie voor notificatiebeheer.

### Configuratieaanbevelingen

Omdat een verlopen wachtwoord kan leiden tot het onvermogen om in te loggen (ook voor beheerdersaccounts), raden we u aan wachtwoorden tijdig te wijzigen. Zorg er ook voor dat er meerdere accounts in het systeem zijn ingesteld die de bevoegdheid hebben om gebruikerswachtwoorden te wijzigen.

## Wachtwoord inlogbeveiliging

Hier stelt u limieten in voor ongeldige wachtwoordinlogpogingen.

![](https://static-docs.nocobase.com/202412281339724.png)

### Maximaal aantal ongeldige wachtwoordinlogpogingen

Stel het maximale aantal inlogpogingen in dat een gebruiker binnen een opgegeven tijdsinterval mag doen.

### Maximaal tijdsinterval voor ongeldige wachtwoordinlog (seconden)

Stel het tijdsinterval (in seconden) in waarbinnen het maximale aantal ongeldige inlogpogingen van een gebruiker wordt berekend.

### Blokkeerduur (seconden)

Stel de duur in waarvoor een gebruiker wordt geblokkeerd nadat de limiet voor ongeldige wachtwoordinlogpogingen is overschreden (0 betekent geen beperking). Gedurende deze blokkeerperiode is het de gebruiker verboden het systeem te benaderen via welke authenticatiemethode dan ook, inclusief API-sleutels. Als u een gebruiker handmatig wilt ontgrendelen, raadpleegt u [Gebruiker blokkeren](./lockout.md).

### Scenario's

#### Geen beperkingen

Er zijn geen beperkingen op het aantal ongeldige wachtwoordpogingen door gebruikers.

![](https://static-docs.nocobase.com/202412281343226.png)

#### Beperk pogingsfrequentie, blokkeer gebruiker niet

Voorbeeld: Een gebruiker kan elke 5 minuten maximaal 5 keer proberen in te loggen.

![](https://static-docs.nocobase.com/202412281344412.png)

#### Blokkeer gebruiker na overschrijden limiet

Voorbeeld: Als een gebruiker binnen 5 minuten 5 opeenvolgende ongeldige wachtwoordinlogpogingen doet, wordt de gebruiker 2 uur geblokkeerd.

![](https://static-docs.nocobase.com/202412281344952.png)

### Configuratieaanbevelingen

- De configuratie van het aantal ongeldige wachtwoordinlogpogingen en het tijdsinterval wordt doorgaans gebruikt om frequent inloggen met wachtwoorden binnen een korte periode te beperken, om zo brute-force-aanvallen te voorkomen.
- Of een gebruiker moet worden geblokkeerd na het overschrijden van de limiet, moet worden overwogen op basis van de feitelijke gebruiksscenario's. De instelling voor de blokkeerduur kan misbruikt worden; aanvallers kunnen opzettelijk meerdere keren een verkeerd wachtwoord invoeren voor een doelaccount, waardoor het account wordt geblokkeerd en onbruikbaar wordt. Dit kan worden voorkomen door IP-beperkingen, API-frequentielimieten en andere maatregelen te combineren.
- Aangezien accountblokkering de toegang tot het systeem verhindert, inclusief voor beheerdersaccounts, is het raadzaam om meerdere accounts in het systeem in te stellen die de bevoegdheid hebben om gebruikers te ontgrendelen.