---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# Microsoft Configuratie

### Vereisten
Om gebruikers in staat te stellen hun Outlook-mailboxen met NocoBase te verbinden, moet u NocoBase implementeren op een server die toegang heeft tot Microsoft-services. De backend zal hiervoor Microsoft API's aanroepen.

### Een account registreren

1. Ga naar https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
2. Meld u aan bij uw Microsoft-account

![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Een tenant aanmaken

1. Ga naar https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount en meld u aan bij uw account.
2. Vul de basisinformatie in en ontvang de verificatiecode.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Vul de overige informatie in en ga verder.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Vul uw creditcardgegevens in (u kunt dit voor nu overslaan).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Client ID ophalen

1. Klik op het bovenste menu en selecteer "Microsoft Entra ID".

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Selecteer "App registrations" aan de linkerkant.

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Klik bovenaan op "New registration".

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Vul de informatie in en dien deze in.

De naam kunt u vrij kiezen. Voor accounttypen selecteert u de optie die in de onderstaande afbeelding wordt getoond. De Redirect URI kunt u voor nu leeg laten.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Haal de Client ID op.

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### API-autorisatie

1. Open het menu "API permissions" aan de linkerkant.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Klik op de knop "Add a permission".

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Klik op "Microsoft Graph".

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Zoek en voeg de volgende machtigingen toe. Het uiteindelijke resultaat zou eruit moeten zien zoals in de onderstaande afbeelding.

    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (By default)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Geheime sleutel ophalen

1. Klik aan de linkerkant op "Certificates & secrets".

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Klik op de knop "New client secret".

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Vul de beschrijving en de vervaldatum in, en klik op Toevoegen.

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Haal de Secret ID op.

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Kopieer de Client ID en Client secret en plak deze in de e-mailconfiguratiepagina.

![](https://static-docs.nocobase.com/mail-1733818630710.png)