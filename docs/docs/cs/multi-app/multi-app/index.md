---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/multi-app/multi-app/index).
:::

# Správa více aplikací

## Funkční přehled

Správa více aplikací je sjednocené řešení správy aplikací poskytované NocoBase pro vytváření a správu více fyzicky izolovaných instancí aplikací NocoBase v jednom nebo více provozních prostředích. Prostřednictvím správce aplikací (AppSupervisor) mohou uživatelé vytvářet a udržovat více aplikací z jednotného vstupního bodu, aby vyhověli potřebám různých obchodních činností a fází rozsahu.

## Samostatná aplikace

V počátečních fázích projektu začíná většina uživatelů s jednou aplikací.

V tomto režimu je třeba nasadit pouze jednu instanci NocoBase a všechny obchodní funkce, data a uživatelé běží ve stejné aplikaci. Nasazení je jednoduché, náklady na konfiguraci jsou nízké a je ideální pro ověřování prototypů, malé projekty nebo interní nástroje.

Jak se však podnikání postupně stává složitějším, čelí jedna aplikace určitým přirozeným omezením:

- Funkce se neustále hromadí a systém se stává nafouknutým
- Různé obchodní činnosti je obtížné izolovat
- Náklady na rozšiřování a údržbu aplikací neustále rostou

V tomto okamžiku budou uživatelé chtít rozdělit různé obchodní činnosti do více aplikací, aby zlepšili udržovatelnost a škálovatelnost systému.

## Více aplikací se sdílenou pamětí

Pokud uživatelé chtějí rozdělit své podnikání, ale nechtějí zavádět složité architektury nasazení a provozu, mohou upgradovat na režim více aplikací se sdílenou pamětí.

V tomto režimu může v jedné instanci NocoBase běžet současně více aplikací. Každá aplikace je nezávislá, může se připojit k nezávislé databázi, může být samostatně vytvořena, spuštěna a zastavena, ale sdílejí stejný proces a paměťový prostor. Uživatelé stále potřebují udržovat pouze jednu instanci NocoBase.

![](https://static-docs.nocobase.com/202512231055907.png)

Tento přístup přináší výrazná zlepšení:

- Obchodní činnosti lze rozdělit podle dimenze aplikací
- Funkce a konfigurace mezi aplikacemi jsou jasnější
- Ve srovnání s řešeními s více procesy nebo více kontejnery je spotřeba zdrojů nižší

Protože však všechny aplikace běží ve stejném procesu, sdílejí zdroje, jako je CPU a paměť. Anomálie nebo vysoké zatížení jedné aplikace může ovlivnit stabilitu ostatních aplikací.

Když se počet aplikací nadále zvyšuje nebo když jsou kladeny vyšší požadavky na izolaci a stabilitu, je třeba architekturu dále upgradovat.

## Hybridní nasazení ve více prostředích

Když rozsah a složitost podnikání dosáhnou určité úrovně a počet aplikací je třeba rozšířit ve velkém měřítku, bude režim více aplikací se sdílenou pamětí čelit výzvám, jako je soupeření o zdroje, stabilita a bezpečnost. Ve fázi škálování mohou uživatelé zvážit přijetí hybridního nasazení ve více prostředích pro podporu složitějších obchodních scénářů.

Jádrem této architektury je zavedení vstupní aplikace, tedy nasazení jedné instance NocoBase jako sjednoceného centra správy a současně nasazení více instancí NocoBase jako provozních prostředí aplikací pro skutečný běh obchodních aplikací.

Vstupní aplikace je zodpovědná za:

- Vytváření, konfiguraci a správu životního cyklu aplikací
- Vydávání příkazů pro správu a souhrn stavů

Prostředí instancí aplikací je zodpovědné za:

- Skutečné hostování a provoz obchodních aplikací prostřednictvím režimu více aplikací se sdílenou pamětí

Pro uživatele lze stále vytvářet a spravovat více aplikací prostřednictvím jednoho vstupu, ale interně:

- Různé aplikace mohou běžet na různých uzlech nebo clusterech
- Každá aplikace může používat nezávislé databáze a middleware
- Aplikace s vysokým zatížením lze podle potřeby rozšiřovat nebo izolovat

![](https://static-docs.nocobase.com/202512231215186.png)

Tento přístup je vhodný pro platformy SaaS, velké množství demo prostředí nebo scénáře s více nájemci, přičemž zajišťuje flexibilitu a zároveň zvyšuje stabilitu a provozuschopnost systému.