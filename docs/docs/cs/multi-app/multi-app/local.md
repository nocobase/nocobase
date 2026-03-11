---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/multi-app/multi-app/local).
:::

# Režim sdílené paměti

## Představení

Pokud si uživatelé přejí rozdělit své podnikání na úrovni aplikací, ale nechtějí zavádět složitou architekturu nasazení a provozu, mohou využít režim více aplikací se sdílenou pamětí.

V tomto režimu může v rámci jedné instance NocoBase běžet současně několik aplikací. Každá aplikace je nezávislá, může se připojit k samostatné databázi, lze ji samostatně vytvořit, spustit a zastavit, ale sdílejí stejný proces a paměťový prostor, takže uživatelé stále spravují pouze jednu instanci NocoBase.

## Uživatelská příručka

### Konfigurace proměnných prostředí

Před použitím funkce více aplikací se ujistěte, že jsou při spuštění NocoBase nastaveny následující proměnné prostředí:

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Vytvoření aplikace

V nabídce nastavení systému klikněte na „App Supervisor“ a přejděte na stránku správy aplikací.

![](https://static-docs.nocobase.com/202512291056215.png)

Kliknutím na tlačítko „Přidat nový“ vytvořte novou aplikaci.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Popis položek konfigurace

| Konfigurační položka | Popis |
| --- | --- |
| **Název aplikace** | Název aplikace zobrazený v rozhraní |
| **Identifikátor aplikace** | Identifikátor aplikace, globálně unikátní |
| **Režim spuštění** | - Spustit při první návštěvě: spustí se, až když uživatel poprvé přistoupí k podaplikaci přes URL<br>- Spustit společně s hlavní aplikací: spustí se současně s hlavní aplikací (prodlouží čas spouštění hlavní aplikace) |
| **Prostředí** | V režimu sdílené paměti je k dispozici pouze lokální prostředí, tedy `local` |
| **Připojení k databázi** | Slouží ke konfiguraci hlavního zdroje dat aplikace, podporuje tři způsoby:<br>- Nová databáze: využije aktuální databázovou službu a vytvoří samostatnou databázi<br>- Nové datové připojení: připojení k jiné databázové službě<br>- Režim Schema: pokud je aktuálním hlavním zdrojem dat PostgreSQL, vytvoří pro aplikaci samostatné schéma |
| **Aktualizace** | Pokud připojená databáze obsahuje data aplikace NocoBase nižší verze, zda povolit automatickou aktualizaci na aktuální verzi aplikace |
| **JWT klíč** | Automaticky vygeneruje nezávislý JWT klíč pro aplikaci, čímž zajistí nezávislost relací aplikace na hlavní aplikaci a ostatních aplikacích |
| **Vlastní doména** | Konfigurace nezávislé domény pro přístup k aplikaci |

### Spuštění aplikace

Kliknutím na tlačítko **Spustit** můžete spustit podaplikaci.

> Pokud jste při vytváření zaškrtli _„Spustit při první návštěvě“_, aplikace se při prvním přístupu spustí automaticky.

![](https://static-docs.nocobase.com/202512291121065.png)

### Přístup k aplikaci

Kliknutím na tlačítko **Navštívit** se podaplikace otevře na nové kartě.

Ve výchozím nastavení se k podaplikaci přistupuje přes `/apps/:appName/admin/`, například:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

Současně lze pro podaplikaci nakonfigurovat nezávislou doménu, kterou je třeba nasměrovat na aktuální IP adresu. Pokud používáte Nginx, je nutné doménu přidat i do konfigurace Nginx.

### Zastavení aplikace

Kliknutím na tlačítko **Zastavit** můžete podaplikaci zastavit.

![](https://static-docs.nocobase.com/202512291122113.png)

### Stav aplikace

V seznamu můžete vidět aktuální stav každé aplikace.

![](https://static-docs.nocobase.com/202512291122339.png)

### Odstranění aplikace

Kliknutím na tlačítko **Smazat** můžete aplikaci odebrat.

![](https://static-docs.nocobase.com/202512291122178.png)

## Často kladené dotazy

### 1. Správa pluginů

Pluginy dostupné pro ostatní aplikace jsou stejné jako u hlavní aplikace (včetně verzí), ale lze je nezávisle konfigurovat a používat.

### 2. Izolace databáze

Ostatní aplikace mohou mít nakonfigurovány nezávislé databáze. Pokud chcete sdílet data mezi aplikacemi, lze toho dosáhnout prostřednictvím externích zdrojů dat.

### 3. Zálohování a migrace dat

V současné době zálohování dat v hlavní aplikaci nepodporuje zahrnutí dat ostatních aplikací (obsahuje pouze základní informace o aplikaci). Zálohování a migraci je nutné provádět ručně v rámci jednotlivých aplikací.

### 4. Nasazení a aktualizace

V režimu sdílené paměti budou verze ostatních aplikací automaticky následovat hlavní aplikaci, čímž je automaticky zajištěna konzistence verzí aplikací.

### 5. Relace aplikace

- Pokud aplikace používá nezávislý JWT klíč, je relace aplikace nezávislá na hlavní aplikaci a ostatních aplikacích. Pokud přistupujete k různým aplikacím přes podcesty stejné domény, je kvůli ukládání TOKENU aplikace v LocalStorage nutné se při přepínání mezi aplikacemi znovu přihlásit. Pro lepší izolaci relací doporučujeme nakonfigurovat pro různé aplikace nezávislé domény.
- Pokud aplikace nepoužívá nezávislý JWT klíč, bude sdílet relaci hlavní aplikace. Po návštěvě jiné aplikace ve stejném prohlížeči se při návratu do hlavní aplikace není třeba znovu přihlašovat. To však představuje bezpečnostní riziko: pokud se ID uživatelů v různých aplikacích shodují, může dojít k neoprávněnému přístupu uživatele k datům jiných aplikací.