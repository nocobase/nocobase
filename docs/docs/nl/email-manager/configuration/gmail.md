---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Google Configuratie

### Vereisten

Om gebruikers in staat te stellen hun Google Mail-accounts te koppelen aan NocoBase, moet NocoBase geïnstalleerd zijn op een server die toegang heeft tot Google-services. De backend zal namelijk de Google API aanroepen.
    
### Een account registreren

1. Ga naar Google Cloud door https://console.cloud.google.com/welcome te openen.
2. Bij uw eerste bezoek dient u akkoord te gaan met de algemene voorwaarden.
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Een app aanmaken

1. Klik bovenaan op "Select a project".
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Klik in het pop-upvenster op de knop "NEW PROJECT".

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Vul de projectinformatie in.
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. Nadat het project is aangemaakt, selecteert u het.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### De Gmail API inschakelen

1. Klik op de knop "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Ga naar het dashboard van APIs & Services.

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Zoek naar "mail".

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Klik op de knop "ENABLE" om de Gmail API in te schakelen.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Het OAuth-toestemmingsscherm configureren

1. Klik in het linkermenu op "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Selecteer "External".

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Vul de projectinformatie in (deze wordt later weergegeven op de autorisatiepagina) en klik op opslaan.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Vul de contactinformatie voor de ontwikkelaar in en klik op doorgaan.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Klik op doorgaan.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Voeg testgebruikers toe voor tests voordat de app wordt gepubliceerd.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Klik op doorgaan.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Controleer de overzichtsinformatie en keer terug naar het dashboard.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Inloggegevens aanmaken

1. Klik in het linkermenu op "Credentials".

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Klik op de knop "CREATE CREDENTIALS" en selecteer "OAuth client ID".

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Selecteer "Web application".

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Vul de applicatie-informatie in.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Voer het uiteindelijke implementatiedomein van het project in (het voorbeeld hier is een testadres van NocoBase).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Voeg de geautoriseerde omleidings-URI toe. Deze moet `domein + "/admin/settings/mail/oauth2"` zijn. Voorbeeld: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Klik op aanmaken om de OAuth-informatie te bekijken.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Kopieer de Client ID en Client secret en plak deze in de e-mailconfiguratiepagina.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Klik op opslaan om de configuratie te voltooien.

### De app publiceren

Nadat u het bovenstaande proces heeft voltooid en functies zoals autorisatie van testgebruikers en het verzenden van e-mails heeft getest, kunt u de app publiceren.

1. Klik op het menu "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Klik op de knop "EDIT APP" en vervolgens onderaan op de knop "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Klik op de knop "ADD OR REMOVE SCOPES" om de gebruikersmachtigingsbereiken te selecteren.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Zoek naar "Gmail API" en vink vervolgens "Gmail API" aan (controleer of de Scope-waarde de Gmail API is met "https://mail.google.com/").

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Klik onderaan op de knop "UPDATE" om op te slaan.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Klik onderaan elke pagina op de knop "SAVE AND CONTINUE" en klik ten slotte op de knop "BACK TO DASHBOARD" om terug te keren naar de dashboardpagina.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Klik op de knop "PUBLISH APP". Er verschijnt een bevestigingspagina met de vereiste informatie voor publicatie. Klik vervolgens op de knop "CONFIRM".

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Keer terug naar de consolepagina en u ziet dat de publicatiestatus "In production" is.

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Klik op de knop "PREPARE FOR VERIFICATION", vul de vereiste informatie in en klik op de knop "SAVE AND CONTINUE" (de gegevens in de afbeelding zijn alleen ter illustratie).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Blijf de benodigde informatie invullen (de gegevens in de afbeelding zijn alleen ter illustratie).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Klik op de knop "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Klik op de knop "SUBMIT FOR VERIFICATION" om de verificatie in te dienen.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Wacht op het goedkeuringsresultaat.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Als de goedkeuring nog in behandeling is, kunnen gebruikers op de onveilige link klikken om te autoriseren en in te loggen.

![](https://static-docs.nocobase.com/mail-1735633689645.png)