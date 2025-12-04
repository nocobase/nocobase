---
pkg: "@nocobase/plugin-email-manager"
---

:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Konfigurace Google

### Předpoklady

Aby uživatelé mohli připojit své účty Google Mail k NocoBase, musí být NocoBase nasazeno na serveru, který má přístup ke službám Google. Backend totiž bude volat Google API.

### Registrace účtu

1. Otevřete https://console.cloud.google.com/welcome a přejděte do Google Cloud.
2. Při prvním vstupu budete muset souhlasit s podmínkami.

![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Vytvoření aplikace

1. Klikněte nahoře na "Select a project".

![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. V plovoucím okně klikněte na tlačítko "NEW PROJECT".

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Vyplňte informace o projektu.

![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. Po vytvoření projektu jej vyberte.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Povolení Gmail API

1. Klikněte na tlačítko "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Přejděte na panel "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Vyhledejte "mail".

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Klikněte na tlačítko "ENABLE" pro povolení Gmail API.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Konfigurace obrazovky souhlasu OAuth

1. V levém menu klikněte na "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Vyberte "External".

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Vyplňte informace o projektu (ty se zobrazí na autorizační stránce) a klikněte na uložit.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Vyplňte kontaktní informace pro vývojáře ("Developer contact information") a klikněte na pokračovat.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Klikněte na pokračovat.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Přidejte testovací uživatele pro testování před publikováním aplikace.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Klikněte na pokračovat.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Zkontrolujte souhrnné informace a vraťte se na řídicí panel.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Vytvoření pověření (Credentials)

1. V levém menu klikněte na "Credentials".

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Klikněte na tlačítko "CREATE CREDENTIALS" a vyberte "OAuth client ID".

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Vyberte "Web application".

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Vyplňte informace o aplikaci.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Zadejte finální doménu, na které bude projekt nasazen (zde je příklad testovací adresy NocoBase).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Přidejte autorizovanou adresu pro přesměrování (callback URI). Musí to být `doména + "/admin/settings/mail/oauth2"`. Příklad: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Klikněte na vytvořit, abyste si prohlédli informace OAuth.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Zkopírujte Client ID a Client secret a vložte je na stránku konfigurace e-mailu.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Klikněte na uložit pro dokončení konfigurace.

### Publikování aplikace

Po dokončení výše uvedeného procesu a otestování funkcí, jako je autorizace testovacích uživatelů a odesílání e-mailů, můžete aplikaci publikovat.

1. Klikněte na menu "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Klikněte na tlačítko "EDIT APP" a poté na tlačítko "SAVE AND CONTINUE" dole.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Klikněte na tlačítko "ADD OR REMOVE SCOPES" pro výběr rozsahů uživatelských oprávnění.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Vyhledejte "Gmail API" a poté zaškrtněte "Gmail API" (ujistěte se, že hodnota Scope je Gmail API s "https://mail.google.com/").

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Klikněte na tlačítko "UPDATE" dole pro uložení.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Klikněte na tlačítko "SAVE AND CONTINUE" dole na každé stránce a nakonec klikněte na tlačítko "BACK TO DASHBOARD" pro návrat na stránku řídicího panelu.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Po kliknutí na tlačítko "PUBLISH APP" se zobrazí stránka s potvrzením publikování, která uvádí požadované informace pro publikování. Poté klikněte na tlačítko "CONFIRM".

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Vraťte se na stránku konzole a uvidíte, že stav publikování je "In production".

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Klikněte na tlačítko "PREPARE FOR VERIFICATION", vyplňte požadované informace a klikněte na tlačítko "SAVE AND CONTINUE" (údaje na obrázku jsou pouze pro ilustraci).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Pokračujte ve vyplňování potřebných informací (údaje na obrázku jsou pouze pro ilustraci).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Klikněte na tlačítko "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Klikněte na tlačítko "SUBMIT FOR VERIFICATION" pro odeslání k ověření.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Počkejte na výsledek schválení.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Pokud schválení stále probíhá, uživatelé mohou kliknout na "unsafe" odkaz pro autorizaci a přihlášení.

![](https://static-docs.nocobase.com/mail-1735633689645.png)