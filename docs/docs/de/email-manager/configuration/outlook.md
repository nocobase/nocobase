---
pkg: "@nocobase/plugin-email-manager"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Microsoft-Konfiguration

### Voraussetzungen
Damit Benutzer ihre Outlook-Postfächer mit NocoBase verbinden können, muss NocoBase auf einem Server bereitgestellt werden, der auf Microsoft-Dienste zugreifen kann. Das Backend wird Microsoft-APIs aufrufen.

### Konto registrieren

1. Öffnen Sie https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
    
2. Melden Sie sich bei Ihrem Microsoft-Konto an.
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Mandanten erstellen

1. Öffnen Sie https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount und melden Sie sich bei Ihrem Konto an.
    
2. Füllen Sie die grundlegenden Informationen aus und fordern Sie den Bestätigungscode an.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Füllen Sie die restlichen Informationen aus und fahren Sie fort.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Geben Sie Ihre Kreditkarteninformationen ein (Sie können diesen Schritt vorerst überspringen).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Client-ID abrufen

1. Klicken Sie auf das obere Menü und wählen Sie "Microsoft Entra ID" aus.

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Wählen Sie links "App registrations" aus.

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Klicken Sie oben auf "New registration".

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Füllen Sie die Informationen aus und senden Sie diese ab.

Sie können einen beliebigen Namen wählen. Für die Kontotypen wählen Sie die in der Abbildung unten gezeigte Option aus. Die Redirect-URI können Sie vorerst leer lassen.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Rufen Sie die Client-ID ab.

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### API-Autorisierung

1. Öffnen Sie das Menü "API permissions" auf der linken Seite.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Klicken Sie auf die Schaltfläche "Add a permission".

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Klicken Sie auf "Microsoft Graph".

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Suchen und fügen Sie die folgenden Berechtigungen hinzu. Das Endergebnis sollte wie in der Abbildung unten aussehen.
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (By default)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Geheimnis abrufen

1. Klicken Sie links auf "Certificates & secrets".

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Klicken Sie auf die Schaltfläche "New client secret".

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Geben Sie die Beschreibung und die Ablaufzeit ein und klicken Sie auf "Add".

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Rufen Sie die Secret-ID ab.

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Kopieren Sie die Client-ID und das Client-Geheimnis und fügen Sie diese auf der E-Mail-Konfigurationsseite ein.

![](https://static-docs.nocobase.com/mail-1733818630710.png)