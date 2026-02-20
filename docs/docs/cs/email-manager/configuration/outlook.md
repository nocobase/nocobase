---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Konfigurace Microsoft

### Předpoklady
Aby uživatelé mohli připojit své poštovní schránky Outlook k NocoBase, musíte systém nasadit na serveru, který má přístup ke službám Microsoft. Backend bude volat Microsoft API.

### Registrace účtu

1. Přejděte na https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
    
2. Přihlaste se ke svému účtu Microsoft.
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Vytvoření tenanta

1. Přejděte na https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount a přihlaste se ke svému účtu.
    
2. Vyplňte základní informace a získejte ověřovací kód.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Vyplňte zbývající informace a pokračujte.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Vyplňte údaje o své kreditní kartě (tento krok můžete prozatím přeskočit).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Získání Client ID

1. Klikněte na horní menu a vyberte "Microsoft Entra ID".

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Vlevo vyberte "App registrations".

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Nahoře klikněte na "New registration".

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Vyplňte informace a odešlete je.

Název může být libovolný. Typy účtů vyberte podle obrázku níže. Pole Redirect URI můžete prozatím ponechat prázdné.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Získejte Client ID.

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### Autorizace API

1. Vlevo otevřete menu "API permissions".

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Klikněte na tlačítko "Add a permission".

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Klikněte na "Microsoft Graph".

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Vyhledejte a přidejte následující oprávnění. Konečný výsledek by měl vypadat jako na obrázku níže.
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (By default)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Získání tajného klíče

1. Vlevo klikněte na "Certificates & secrets".

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Klikněte na tlačítko "New client secret".

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Vyplňte popis a dobu platnosti a klikněte na Přidat.

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Získejte Secret ID.

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Zkopírujte Client ID a Client secret a vložte je na stránku konfigurace e-mailu.

![](https://static-docs.nocobase.com/mail-1733818630710.png)