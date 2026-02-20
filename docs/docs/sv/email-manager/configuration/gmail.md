---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Google-konfiguration

### Förutsättningar

För att användare ska kunna ansluta sina Google Mail-konton till NocoBase måste systemet vara driftsatt på en server som har åtkomst till Googles tjänster, eftersom backend kommer att anropa Google API:er.
    
### Registrera ett konto

1. Öppna https://console.cloud.google.com/welcome för att komma till Google Cloud.
2. Vid första besöket behöver ni godkänna relevanta villkor.
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Skapa en app

1. Klicka på "Select a project" högst upp.
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Klicka på knappen "NEW PROJECT" i popup-fönstret.

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Fyll i projektinformationen.
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. När projektet har skapats, välj det.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Aktivera Gmail API

1. Klicka på knappen "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Gå till kontrollpanelen för "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Sök efter "mail".

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Klicka på knappen "ENABLE" för att aktivera Gmail API.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Konfigurera OAuth-medgivandeskärmen

1. Klicka på menyn "OAuth consent screen" till vänster.

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Välj "External".

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Fyll i projektinformationen (denna kommer att visas på auktoriseringssidan) och klicka på spara.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Fyll i kontaktinformationen för utvecklaren och klicka på fortsätt.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Klicka på fortsätt.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Lägg till testanvändare för testning innan appen publiceras.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Klicka på fortsätt.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Granska sammanfattningsinformationen och återgå till kontrollpanelen.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Skapa autentiseringsuppgifter

1. Klicka på menyn "Credentials" till vänster.

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Klicka på knappen "CREATE CREDENTIALS" och välj "OAuth client ID".

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Välj "Web application".

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Fyll i applikationsinformationen.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Ange projektets slutliga driftsättningsdomän (exemplet här är en NocoBase-testadress).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Lägg till den auktoriserade omdirigerings-URI:n. Den måste vara `domän + "/admin/settings/mail/oauth2"`. Exempel: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Klicka på skapa för att se OAuth-informationen.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Kopiera Client ID och Client secret och klistra in dem på sidan för e-postkonfiguration.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Klicka på spara för att slutföra konfigurationen.

### Publicera appen

När ovanstående process är klar och funktioner som auktorisering av testanvändare och e-postsändning har testats, kan ni publicera appen.

1. Klicka på menyn "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Klicka på knappen "EDIT APP", och sedan på knappen "SAVE AND CONTINUE" längst ner.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Klicka på knappen "ADD OR REMOVE SCOPES" för att välja användarbehörighetsomfång.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Sök efter "Gmail API" och markera sedan "Gmail API" (bekräfta att Scope-värdet är Gmail API med "https://mail.google.com/").

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Klicka på knappen "UPDATE" längst ner för att spara.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Klicka på knappen "SAVE AND CONTINUE" längst ner på varje sida, och slutligen på knappen "BACK TO DASHBOARD" för att återgå till kontrollpanelen.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Klicka på knappen "PUBLISH APP". En bekräftelsesida visas, som listar den information som krävs för publicering. Klicka sedan på knappen "CONFIRM".

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Återgå till konsolsidan, och ni kommer att se att publiceringsstatusen är "In production".

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Klicka på knappen "PREPARE FOR VERIFICATION", fyll i den obligatoriska informationen och klicka på knappen "SAVE AND CONTINUE" (datan i bilden är endast för demonstrationssyfte).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Fortsätt att fylla i nödvändig information (datan i bilden är endast för demonstrationssyfte).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Klicka på knappen "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Klicka på knappen "SUBMIT FOR VERIFICATION" för att skicka in för verifiering.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Vänta på godkännanderesultatet.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Om godkännandet fortfarande väntar kan användare klicka på den osäkra länken för att auktorisera och logga in.

![](https://static-docs.nocobase.com/mail-1735633689645.png)