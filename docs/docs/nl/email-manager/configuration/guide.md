---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Configuratieproces

## Overzicht
Nadat u de e-mail plugin heeft ingeschakeld, moeten beheerders eerst de nodige configuratie voltooien voordat gebruikers hun e-mailaccounts kunnen koppelen aan NocoBase. (Momenteel wordt alleen autorisatie voor Outlook- en Gmail-accounts ondersteund; directe aanmelding met Microsoft- en Google-accounts is nog niet beschikbaar).

De kern van de configuratie ligt in de authenticatie-instellingen voor de API-aanroepen van de e-mailprovider. Beheerders moeten de volgende stappen voltooien om ervoor te zorgen dat de plugin correct functioneert:

1.  **Authenticatie-informatie verkrijgen van de serviceprovider**
    -   Log in bij de ontwikkelaarsconsole van de e-mailprovider (bijv. Google Cloud Console of Microsoft Azure Portal).
    -   Maak een nieuwe applicatie of project aan en schakel de Gmail of Outlook e-mail API-service in.
    -   Verkrijg de bijbehorende Client ID en Client Secret.
    -   Configureer de Redirect URI zodat deze overeenkomt met het callback-adres van de NocoBase plugin.

2.  **Configuratie van de e-mailprovider**
    -   Ga naar de configuratiepagina van de e-mail plugin.
    -   Geef de vereiste API-authenticatie-informatie op, inclusief Client ID en Client Secret, om een correcte autorisatie met de e-mailprovider te garanderen.

3.  **Aanmelden via autorisatie**
    -   Gebruikers melden zich aan bij hun e-mailaccounts via het OAuth-protocol.
    -   De plugin genereert en slaat automatisch het autorisatietoken van de gebruiker op, dat wordt gebruikt voor latere API-aanroepen en e-mailbewerkingen.

4.  **E-mailaccounts koppelen**
    -   Na succesvolle autorisatie wordt het e-mailaccount van de gebruiker gekoppeld aan NocoBase.
    -   De plugin synchroniseert de e-mailgegevens van de gebruiker en biedt functionaliteiten voor het beheren, verzenden en ontvangen van e-mails.

5.  **E-mailfunctionaliteiten gebruiken**
    -   Gebruikers kunnen e-mails direct binnen het platform bekijken, beheren en verzenden.
    -   Alle bewerkingen worden voltooid via de API-aanroepen van de e-mailprovider, wat zorgt voor realtime synchronisatie en efficiënte overdracht.

Via het hierboven beschreven proces biedt de e-mail plugin van NocoBase gebruikers efficiënte en veilige e-mailbeheerdiensten. Als u problemen ondervindt tijdens de configuratie, raadpleeg dan de relevante documentatie of neem contact op met het technische ondersteuningsteam voor hulp.

## Plugin configuratie

### E-mail plugin inschakelen

1.  Ga naar de plugin beheerpagina
2.  Zoek de "Email manager" plugin en schakel deze in

### Configuratie van e-mailproviders

Nadat de e-mail plugin is ingeschakeld, kunt u de e-mailproviders configureren. Momenteel worden Google- en Microsoft-e-maildiensten ondersteund. Klik bovenaan op "Instellingen" -> "E-mailinstellingen" om naar de instellingenpagina te gaan.

![](https://static-docs.nocobase.com/mail-1733818617187.png)

![](https://static-docs.nocobase.com/mail-1733818617514.png)

Voor elke serviceprovider moet u de Client ID en Client Secret invullen. In de volgende secties wordt gedetailleerd beschreven hoe u deze twee parameters verkrijgt.