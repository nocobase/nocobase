---
pkg: '@nocobase/plugin-auth'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# Wachtwoordauthenticatie

## Configuratie-interface

![](https://static-docs.nocobase.com/202411131505095.png)

## Registratie toestaan

Wanneer registratie is toegestaan, toont de inlogpagina een link om een account aan te maken, en kunt u naar de registratiepagina gaan.

![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)

Registratiepagina

![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)

Wanneer registratie niet is toegestaan, toont de inlogpagina geen link om een account aan te maken.

![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a93745121.png)

Wanneer registratie niet is toegestaan, is de registratiepagina niet toegankelijk.

![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8430556.png)

## Instellingen registratieformulier<Badge>v1.4.0-beta.7+</Badge>

U kunt instellen welke velden in de gebruikerscollectie in het registratieformulier moeten worden weergegeven en of ze verplicht zijn. Minimaal één van de velden 'gebruikersnaam' of 'e-mailadres' moet worden ingesteld als 'weergeven' en 'verplicht'.

![](https://static-docs.nocobase.com/202411262133669.png)

Registratiepagina

![](https://static-docs.nocobase.com/202411262135801.png)

## Wachtwoord vergeten<Badge>v1.8.0+</Badge>

De 'wachtwoord vergeten'-functie stelt gebruikers in staat om hun wachtwoord opnieuw in te stellen via e-mailverificatie, mochten ze het vergeten zijn.

### Configuratie door beheerder

1.  **Wachtwoord vergeten-functie inschakelen**

    Ga naar het tabblad 'Instellingen' > 'Gebruikersauthenticatie' > 'Wachtwoord vergeten' en vink het selectievakje 'Wachtwoord vergeten-functie inschakelen' aan.

    ![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)

2.  **Notificatiekanaal configureren**

    Selecteer een e-mailnotificatiekanaal (momenteel wordt alleen e-mail ondersteund). Als er geen notificatiekanaal beschikbaar is, moet u er eerst een toevoegen.

    ![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)

3.  **E-mail voor wachtwoordherstel configureren**

    Pas het e-mailonderwerp en de inhoud aan. HTML- of platte tekstindeling wordt ondersteund. U kunt de volgende variabelen gebruiken:
    - Huidige gebruiker
    - Systeeminstellingen
    - Link voor wachtwoordherstel
    - Geldigheidsduur herstellink (minuten)

    ![20250427170047](https://static-docs.nocobase.com/20250427170047.png)

4.  **Geldigheidsduur herstellink instellen**

    Stel de geldigheidsduur (in minuten) van de herstellink in. De standaardwaarde is 120 minuten.

    ![20250423073557](https://static-docs.nocobase.com/20250423073557.png)

### Gebruikersworkflow

1.  **Wachtwoordherstel aanvragen**

    Klik op de inlogpagina op de link 'Wachtwoord vergeten' (de beheerder moet de wachtwoord vergeten-functie eerst inschakelen) om naar de pagina 'Wachtwoord vergeten' te gaan.

    ![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)

    Voer het geregistreerde e-mailadres in en klik op de knop 'Herstele-mail verzenden'.

    ![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)

2.  **Wachtwoord opnieuw instellen**

    De gebruiker ontvangt een e-mail met een herstellink. Klik op de link om een pagina te openen waar u een nieuw wachtwoord kunt instellen.

    ![20250421113748](https://static-docs.nocobase.com/20250421113748.png)

    Nadat u het hebt ingesteld, kunt u met het nieuwe wachtwoord inloggen op het systeem.

### Aandachtspunten

- De herstellink heeft een tijdslimiet; deze is standaard 120 minuten geldig na generatie (configureerbaar door de beheerder).
- De link kan slechts één keer worden gebruikt en vervalt onmiddellijk na gebruik.
- Als u de herstele-mail niet ontvangt, controleer dan of het e-mailadres correct is, of controleer uw spammap.
- De beheerder moet ervoor zorgen dat de e-mailserver correct is geconfigureerd om te garanderen dat de herstele-mail succesvol kan worden verzonden.