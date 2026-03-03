---
pkg: "@nocobase/plugin-multi-app-manager"
---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/multi-space/multi-app).
:::

# Multi-app

## Úvod

**Plugin Multi-app** umožňuje dynamicky vytvářet a spravovat více nezávislých aplikací bez nutnosti samostatného nasazení. Každá podaplikace (sub-app) je zcela nezávislá instance s vlastní databází, pluginy a konfigurací.

#### Případy použití
- **Multi-tenancy (vícenásobný pronájem)**: Poskytuje nezávislé instance aplikací, kde má každý zákazník vlastní data, konfigurace pluginů a systémy oprávnění.
- **Hlavní a vedlejší systémy pro různé obchodní domény**: Velký systém složený z několika nezávisle nasazených malých aplikací.

:::warning
Plugin Multi-app sám o sobě neposkytuje možnosti sdílení uživatelů.  
Pro propojení uživatelů mezi více aplikacemi jej lze použít v kombinaci s **[autentizačním pluginem](/auth-verification)**.
:::

## Instalace

V horní části správy pluginů vyhledejte plugin **Multi-app** a povolte jej.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)

## Uživatelská příručka

### Vytvoření podaplikace

V nabídce nastavení systému klikněte na „Multi-app“ pro vstup na stránku správy více aplikací:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Kliknutím na tlačítko „Přidat novou“ vytvoříte novou podaplikaci:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Popis polí formuláře

* **Název**: Identifikátor podaplikace, globálně unikátní.
* **Zobrazovaný název**: Název podaplikace zobrazený v rozhraní.
* **Režim spuštění**:
  * **Spustit při prvním přístupu**: Podaplikace se spustí pouze tehdy, když k ní uživatel poprvé přistoupí přes URL.
  * **Spustit společně s hlavní aplikací**: Podaplikace se spustí současně s hlavní aplikací (to prodlužuje dobu spouštění hlavní aplikace).
* **Port**: Číslo portu, který podaplikace používá během běhu.
* **Vlastní doména**: Konfigurace nezávislé subdomény pro podaplikaci.
* **Připnout do nabídky**: Připne vstup do podaplikace na levou stranu horního navigačního panelu.
* **Připojení k databázi**: Slouží ke konfiguraci zdroje dat pro podaplikaci, podporuje tři metody:
  * **Nová databáze**: Znovu využije aktuální databázovou službu k vytvoření nezávislé databáze.
  * **Nové datové připojení**: Konfiguruje zcela novou databázovou službu.
  * **Režim schématu**: Vytvoří v PostgreSQL nezávislé schéma pro podaplikaci.
* **Aktualizace**: Pokud připojená databáze obsahuje starší verzi datové struktury NocoBase, bude automaticky aktualizována na aktuální verzi.

### Spouštění a zastavování podaplikací

Kliknutím na tlačítko **Spustit** spustíte podaplikaci.  
> Pokud byla při vytváření zaškrtnuta možnost *„Spustit při prvním přístupu“*, spustí se automaticky při první návštěvě.  

Kliknutím na tlačítko **Zobrazit** otevřete podaplikaci na nové kartě.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)

### Stav běhu a protokoly podaplikace

V seznamu můžete vidět využití paměti a CPU každé aplikace.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Kliknutím na tlačítko **Protokoly** (Logs) zobrazíte protokoly o běhu podaplikace.  
> Pokud je podaplikace po spuštění nedostupná (např. kvůli poškození databáze), můžete problém diagnostikovat pomocí protokolů.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)

### Odstranění podaplikace

Kliknutím na tlačítko **Odstranit** podaplikaci odeberete.  
> Při odstraňování si můžete vybrat, zda chcete smazat i databázi. Postupujte prosím opatrně, tato akce je nevratná.

### Přístup k podaplikacím
Ve výchozím nastavení použijte pro přístup k podaplikacím `/_app/:appName/admin/`, například:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Dále můžete pro podaplikace nakonfigurovat nezávislé subdomény. Doménu je třeba nasměrovat na aktuální IP adresu. Pokud používáte Nginx, musí být doména přidána také do konfigurace Nginx.

### Správa podaplikací přes příkazový řádek (CLI)

V kořenovém adresáři projektu můžete ke správě instancí podaplikací použít příkazový řádek přes **PM2**:

```bash
yarn nocobase pm2 list              # Zobrazit seznam aktuálně běžících instancí
yarn nocobase pm2 stop [appname]    # Zastavit proces konkrétní podaplikace
yarn nocobase pm2 delete [appname]  # Odstranit proces konkrétní podaplikace
yarn nocobase pm2 kill              # Vynuceně ukončit všechny spuštěné procesy (může zahrnovat i instanci hlavní aplikace)
```

### Migrace dat ze staré verze Multi-app

Přejděte na stránku správy staré verze Multi-app a kliknutím na tlačítko **Migrovat data do nové Multi-app** proveďte migraci.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)

## Často kladené dotazy (FAQ)

#### 1. Správa pluginů
Podaplikace mohou používat stejné pluginy jako hlavní aplikace (včetně verzí), ale pluginy lze konfigurovat a používat nezávisle.

#### 2. Izolace databáze
Podaplikace lze konfigurovat s nezávislými databázemi. Pokud chcete sdílet data mezi aplikacemi, lze toho dosáhnout prostřednictvím externích zdrojů dat.

#### 3. Zálohování a migrace dat
V současné době zálohování dat v hlavní aplikaci nezahrnuje data podaplikací (obsahuje pouze základní informace o podaplikaci). Zálohování a migrace musí být prováděny ručně v rámci každé podaplikace.

#### 4. Nasazení a aktualizace
Verze podaplikací budou automaticky následovat aktualizace hlavní aplikace, což zajistí konzistenci verzí mezi hlavní a vedlejšími aplikacemi.

#### 5. Správa zdrojů
Spotřeba zdrojů každé podaplikace je v podstatě stejná jako u hlavní aplikace. V současné době je využití paměti jednou aplikací přibližně 500–600 MB.