---
pkg: "@nocobase/plugin-auth-ldap"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



pkg: '@nocobase/plugin-auth-ldap'
---

# Authenticatie: LDAP

## Introductie

De Authenticatie: LDAP plugin volgt de LDAP (Lightweight Directory Access Protocol) protocolstandaard, waardoor gebruikers kunnen inloggen bij NocoBase met hun accountgegevens van de LDAP-server.

## Plugin activeren

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## LDAP-authenticatie toevoegen

Ga naar de beheerpagina voor authenticatieplugins.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Toevoegen - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Configuratie

### Basisconfiguratie

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Automatisch registreren als de gebruiker niet bestaat - Of er automatisch een nieuwe gebruiker moet worden aangemaakt wanneer er geen overeenkomende bestaande gebruiker wordt gevonden.
- LDAP URL - Het adres van de LDAP-server
- Bind DN - De DN die wordt gebruikt om de serververbinding te testen en gebruikers te zoeken
- Bind-wachtwoord - Het wachtwoord van de Bind DN
- Verbinding testen - Klik op de knop om de serververbinding te testen en de geldigheid van de Bind DN te controleren.

### Zoekconfiguratie

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- Search DN - De DN die wordt gebruikt om gebruikers te zoeken
- Zoekfilter - De filterconditie voor het zoeken naar gebruikers, waarbij `{{account}}` het gebruikersaccount vertegenwoordigt dat wordt gebruikt bij het inloggen
- Scope - `Base`, `One level`, `Subtree`, standaard `Subtree`
- Groottelimiet - De paginagrootte voor het zoeken

### Attribuuttoewijzing

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Gebruik dit veld om de gebruiker te koppelen - Het veld dat wordt gebruikt om te koppelen aan bestaande gebruikers. Kies 'gebruikersnaam' als het inlogaccount een gebruikersnaam is, of 'e-mailadres' als het een e-mailadres is. Standaard is dit gebruikersnaam.
- Attribuuttoewijzing - De toewijzing van gebruikersattributen aan velden in de NocoBase gebruikerstabel.

## Inloggen

Ga naar de inlogpagina en voer uw LDAP-gebruikersnaam en -wachtwoord in het inlogformulier in om in te loggen.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>