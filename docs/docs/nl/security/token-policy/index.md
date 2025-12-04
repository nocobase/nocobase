---
pkg: '@nocobase/plugin-auth'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Token Beveiligingsbeleid

## Introductie

Het Token Beveiligingsbeleid is een functionele configuratie die is ontworpen om de systeembeveiliging te beschermen en de gebruikerservaring te verbeteren. Het omvat drie belangrijke configuratie-items: 'Sessie geldigheidsduur', 'Token geldigheidsduur' en 'Vernieuwingstermijn voor verlopen tokens'.

## Configuratie-ingang

U vindt de configuratie-ingang onder Plugin instellingen - Beveiliging - Token beleid:

![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

## Sessie geldigheidsduur

**Definitie:**

De sessie geldigheidsduur verwijst naar de maximale periode waarin het systeem een gebruiker een actieve sessie laat behouden na het inloggen.

**Werking:**

Zodra de sessie geldigheidsduur is overschreden, ontvangt de gebruiker een 401-foutmelding bij een volgende toegang tot het systeem, waarna u wordt omgeleid naar de inlogpagina voor herauthenticatie.
Voorbeeld:
Als de sessie geldigheidsduur is ingesteld op 8 uur, verloopt de sessie 8 uur na het inloggen, ervan uitgaande dat er geen verdere interacties plaatsvinden.

**Aanbevolen instellingen:**

- Scenario's voor korte bewerkingen: Aanbevolen 1-2 uur om de veiligheid te verhogen.
- Scenario's voor langdurig werk: Kan worden ingesteld op 8 uur om aan de zakelijke behoeften te voldoen.

## Token geldigheidsduur

**Definitie:**

De token geldigheidsduur verwijst naar de levenscyclus van elke token die door het systeem wordt uitgegeven tijdens de actieve sessie van de gebruiker.

**Werking:**

Wanneer een token verloopt, geeft het systeem automatisch een nieuwe token uit om de sessie actief te houden.
Elke verlopen token mag slechts één keer worden vernieuwd.

**Aanbevolen instellingen:**

Om veiligheidsredenen wordt aanbevolen deze in te stellen tussen 15 en 30 minuten.
Aanpassingen kunnen worden gedaan op basis van de scenariovereisten. Bijvoorbeeld:
Scenario's met hoge beveiliging: De token geldigheidsduur kan worden verkort tot 10 minuten of minder.
Scenario's met laag risico: De token geldigheidsduur kan passend worden verlengd tot 1 uur.

## Vernieuwingstermijn voor verlopen tokens

**Definitie:**

De vernieuwingstermijn voor verlopen tokens verwijst naar het maximale tijdsvenster waarin een gebruiker een nieuwe token kan verkrijgen via een vernieuwingsactie nadat de token is verlopen.

**Kenmerken:**

Als de vernieuwingstermijn wordt overschreden, moet de gebruiker opnieuw inloggen om een nieuwe token te verkrijgen.
De vernieuwingsactie verlengt de sessie geldigheidsduur niet; het genereert alleen een nieuwe token.

**Aanbevolen instellingen:**

Om veiligheidsredenen wordt aanbevolen deze in te stellen tussen 5 en 10 minuten.