---
pkg: '@nocobase/plugin-auth'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Ověřování heslem

## Konfigurační rozhraní

![](https://static-docs.nocobase.com/202411131505095.png)

## Povolit registraci

Pokud je registrace povolena, na přihlašovací stránce se zobrazí odkaz pro vytvoření účtu, který vás přesměruje na registrační stránku.

![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)

Registrační stránka

![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)

Pokud registrace není povolena, přihlašovací stránka nezobrazí odkaz pro vytvoření účtu.

![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a93745121.png)

Pokud registrace není povolena, není možné přistupovat k registrační stránce.

![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8430556.png)

## Nastavení registračního formuláře<Badge>v1.4.0-beta.7+</Badge>

Můžete nastavit, která pole v kolekci uživatelů se mají zobrazit v registračním formuláři a zda jsou povinná. Alespoň jedno z polí (uživatelské jméno nebo e-mail) musí být nastaveno jako zobrazené a povinné.

![](https://static-docs.nocobase.com/202411262133669.png)

Registrační stránka

![](https://static-docs.nocobase.com/202411262135801.png)

## Zapomenuté heslo<Badge>v1.8.0+</Badge>

Funkce zapomenutého hesla umožňuje uživatelům resetovat své heslo prostřednictvím ověření e-mailem, pokud ho zapomenou.

### Konfigurace pro administrátora

1.  **Povolit funkci zapomenutého hesla**

    Na kartě „Nastavení“ > „Ověřování“ > „Zapomenuté heslo“ zaškrtněte políčko „Povolit funkci zapomenutého hesla“.

    ![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)

2.  **Konfigurace notifikačního kanálu**

    Vyberte kanál pro e-mailová oznámení (aktuálně je podporován pouze e-mail). Pokud není k dispozici žádný notifikační kanál, musíte jej nejprve přidat.

    ![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)

3.  **Konfigurace e-mailu pro resetování hesla**

    Přizpůsobte předmět a obsah e-mailu, s podporou formátu HTML nebo prostého textu. Můžete použít následující proměnné:
    - Aktuální uživatel
    - Nastavení systému
    - Odkaz pro resetování hesla
    - Platnost odkazu pro resetování (minuty)

    ![20250427170047](https://static-docs.nocobase.com/20250427170047.png)

4.  **Nastavit platnost odkazu pro resetování**

    Nastavte dobu platnosti odkazu pro resetování (v minutách), výchozí hodnota je 120 minut.

    ![20250423073557](https://static-docs.nocobase.com/20250423073557.png)

### Uživatelský postup

1.  **Zahájit požadavek na resetování hesla**

    Na přihlašovací stránce klikněte na odkaz „Zapomenuté heslo“ (administrátor musí nejprve povolit funkci zapomenutého hesla), čímž se dostanete na stránku pro zapomenuté heslo.

    ![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)

    Zadejte registrovanou e-mailovou adresu a klikněte na tlačítko „Odeslat e-mail pro resetování“.

    ![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)

2.  **Resetovat heslo**

    Uživatel obdrží e-mail s odkazem pro resetování. Po kliknutí na odkaz se otevře stránka, kde si můžete nastavit nové heslo.

    ![20250421113748](https://static-docs.nocobase.com/20250421113748.png)

    Po nastavení se uživatel může přihlásit do systému s novým heslem.

### Důležité poznámky

- Odkaz pro resetování má časové omezení; ve výchozím nastavení je platný 120 minut po vygenerování (lze konfigurovat administrátorem).
- Odkaz lze použít pouze jednou a po použití okamžitě přestane být platný.
- Pokud uživatel neobdrží e-mail pro resetování, zkontrolujte, zda je e-mailová adresa správná, nebo se podívejte do složky se spamem.
- Administrátor by měl zajistit, aby konfigurace e-mailového serveru byla správná, aby bylo zaručeno úspěšné odeslání e-mailu pro resetování.