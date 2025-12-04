---
pkg: "@nocobase/plugin-multi-app-manager"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Více aplikací


## Úvod

**Plugin Více aplikací (Multi-App)** Vám umožňuje dynamicky vytvářet a spravovat více nezávislých aplikací bez nutnosti samostatného nasazení. Každá podaplikace je zcela nezávislá instance s vlastní databází, pluginy a konfigurací.

#### Případy použití
- **Multi-tenancy (více nájemců)**: Poskytněte nezávislé instance aplikací, kde každý zákazník má svá vlastní data, konfigurace pluginů a systém oprávnění.
- **Hlavní a podřízené systémy pro různé obchodní oblasti**: Velký systém složený z více nezávisle nasazených menších aplikací.


:::warning
Plugin Více aplikací sám o sobě neposkytuje možnost sdílení uživatelů.  
Pokud potřebujete sdílet uživatele mezi více aplikacemi, můžete jej použít ve spojení s **[pluginem Ověřování](/auth-verification)**.
:::


## Instalace

V administraci pluginů najděte plugin **Více aplikací (Multi-app)** a aktivujte jej.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)


## Návod k použití


### Vytvoření podaplikace

V nabídce systémových nastavení klikněte na „Více aplikací“ pro vstup na stránku správy více aplikací:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Klikněte na tlačítko „Přidat nové“ pro vytvoření nové podaplikace:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Popis polí formuláře

*   **Název**: Identifikátor podaplikace, globálně unikátní.
*   **Zobrazovaný název**: Název podaplikace zobrazený v uživatelském rozhraní.
*   **Režim spuštění**:
    *   **Spustit při první návštěvě**: Podaplikace se spustí pouze tehdy, když k ní uživatel poprvé přistoupí prostřednictvím URL.
    *   **Spustit s hlavní aplikací**: Podaplikace se spustí současně s hlavní aplikací (to prodlouží dobu spouštění hlavní aplikace).
*   **Port**: Číslo portu používané podaplikací za běhu.
*   **Vlastní doména**: Nakonfigurujte nezávislou subdoménu pro podaplikaci.
*   **Připnout do menu**: Připněte vstup podaplikace na levou stranu horního navigačního panelu.
*   **Připojení k databázi**: Slouží ke konfiguraci zdroje dat pro podaplikaci, podporuje následující tři metody:
    *   **Nová databáze**: Znovu použijte aktuální datovou službu k vytvoření nezávislé databáze.
    *   **Nové datové připojení**: Nakonfigurujte zcela novou databázovou službu.
    *   **Režim schématu (Schema mode)**: Vytvořte nezávislé schéma pro podaplikaci v PostgreSQL.
*   **Upgrade (aktualizace)**: Pokud připojená databáze obsahuje starší verzi datové struktury NocoBase, bude automaticky aktualizována na aktuální verzi.


### Spuštění a zastavení podaplikace

Kliknutím na tlačítko **Spustit** můžete podaplikaci spustit;  
> Pokud byla při vytváření zaškrtnuta možnost *„Spustit při první návštěvě“*, spustí se automaticky při prvním přístupu.  

Kliknutím na tlačítko **Zobrazit** otevřete podaplikaci v nové záložce.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)


### Stav a protokoly podaplikace

V seznamu můžete zobrazit využití paměti a CPU každou aplikací.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Kliknutím na tlačítko **Protokoly** zobrazíte protokoly běhu podaplikace.  
> Pokud je podaplikace po spuštění nedostupná (např. kvůli poškozené databázi), můžete k řešení problémů použít protokoly.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)


### Smazání podaplikace

Kliknutím na tlačítko **Smazat** můžete podaplikaci odstranit.  
> Při mazání si můžete zvolit, zda se má smazat i databáze. Postupujte prosím opatrně, tato akce je nevratná.


### Přístup k podaplikaci
Standardně se k podaplikacím přistupuje pomocí `/_app/:appName/admin/`, například:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Pro podaplikaci můžete také nakonfigurovat nezávislou subdoménu. Bude potřeba nasměrovat doménu na aktuální IP adresu, a pokud používáte Nginx, musíte doménu přidat i do konfigurace Nginx.


### Správa podaplikací pomocí příkazového řádku

V kořenovém adresáři projektu můžete pomocí příkazového řádku spravovat instance podaplikací prostřednictvím **PM2**:

```bash
yarn nocobase pm2 list              # Zobrazit seznam aktuálně spuštěných instancí
yarn nocobase pm2 stop [appname]    # Zastavit proces konkrétní podaplikace
yarn nocobase pm2 delete [appname]  # Smazat proces konkrétní podaplikace
yarn nocobase pm2 kill              # Násilně ukončit všechny spuštěné procesy (může zahrnovat i instanci hlavní aplikace)
```

### Migrace dat ze staré verze Multi-aplikací

Přejděte na starou stránku správy více aplikací a klikněte na tlačítko **Migrovat data do nových multi-aplikací** pro provedení migrace dat.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)


## Často kladené otázky

#### 1. Správa pluginů
Podaplikace mohou používat stejné pluginy jako hlavní aplikace (včetně verzí), ale lze je nezávisle konfigurovat a používat.

#### 2. Izolace databáze
Podaplikace mohou být nakonfigurovány s nezávislými databázemi. Pokud chcete sdílet data mezi aplikacemi, můžete to provést prostřednictvím externích zdrojů dat.

#### 3. Zálohování a migrace dat
V současné době zálohy dat v hlavní aplikaci nezahrnují data podaplikací (pouze základní informace o podaplikacích). Data je nutné ručně zálohovat a migrovat v rámci každé podaplikace.

#### 4. Nasazení a aktualizace
Verze podaplikace se automaticky aktualizuje společně s hlavní aplikací, čímž je zajištěna konzistence verzí mezi hlavní a podaplikací.

#### 5. Správa zdrojů
Spotřeba zdrojů každé podaplikace je v zásadě stejná jako u hlavní aplikace. V současné době spotřebuje jedna aplikace přibližně 500-600 MB paměti.