---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Microsoft-konfiguration

### Förutsättningar
För att användare ska kunna ansluta sina Outlook-brevlådor till NocoBase måste ni distribuera NocoBase på en server som har åtkomst till Microsofts tjänster. Backend kommer att anropa Microsofts API:er.

### Registrera ett konto

1. Gå till https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
    
2. Logga in på ert Microsoft-konto
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Skapa en klient (tenant)

1. Gå till https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount och logga in på ert konto.
    
2. Fyll i grundläggande information och hämta verifieringskoden.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Fyll i övrig information och fortsätt.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Fyll i er kreditkortsinformation (ni kan hoppa över detta steg för tillfället).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Hämta klient-ID (Client ID)

1. Klicka på toppmenyn och välj "Microsoft Entra ID".

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Välj "App registrations" i vänstermenyn.

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Klicka på "New registration" högst upp.

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Fyll i informationen och skicka in.

Namnet kan vara vad som helst. För kontotyper, välj alternativet som visas i bilden nedan. Ni kan lämna "Redirect URI" tomt för tillfället.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Hämta klient-ID:t (Client ID).

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### API-auktorisering

1. Öppna menyn "API permissions" i vänstermenyn.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Klicka på knappen "Add a permission".

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Klicka på "Microsoft Graph".

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Sök efter och lägg till följande behörigheter. Det slutgiltiga resultatet bör se ut som i bilden nedan.
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (By default)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Hämta hemlighet (Secret)

1. Klicka på "Certificates & secrets" i vänstermenyn.

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Klicka på knappen "New client secret".

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Fyll i beskrivning och utgångstid, och klicka sedan på Lägg till.

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Hämta hemlighets-ID:t (Secret ID).

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Kopiera klient-ID:t (Client ID) och klienthemligheten (Client secret) och klistra in dem på sidan för e-postkonfiguration.

![](https://static-docs.nocobase.com/mail-1733818630710.png)