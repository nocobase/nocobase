:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/get-started/system-requirements).
:::

# Systémové požadavky

Systémové požadavky popsané v tomto dokumentu se vztahují na **samotnou aplikační službu NocoBase** a zahrnují výpočetní a paměťové zdroje vyžadované procesy aplikace. **Nezahrnují závislé služby třetích stran**, mimo jiné:

- API brány / reverzní proxy
- Databázové služby (např. MySQL, PostgreSQL)
- Služby mezipaměti (např. Redis)
- Middleware, jako jsou fronty zpráv, objektová úložiště atd.

S výjimkou ověřování funkčnosti nebo čistě experimentálních scénářů **důrazně doporučujeme nasadit výše uvedené služby třetích stran samostatně** na vyhrazené servery nebo do kontejnerů, případně využít příslušné cloudové služby.

Konfigurace systému a plánování kapacity těchto služeb by měly být vyhodnocovány a laděny samostatně na základě **skutečného objemu dat, provozní zátěže a rozsahu souběžných požadavků**.

## Režim nasazení na jednom uzlu

Režim nasazení na jednom uzlu znamená, že aplikační služba NocoBase běží na jediném serveru nebo instanci kontejneru.

### Minimální hardwarové požadavky

| Zdroj | Požadavek |
|---|---|
| CPU | 1 jádro |
| Paměť | 2 GB |

**Vhodné scénáře**:

- Mikropodnikání
- Ověření konceptu (POC)
- Vývojové / testovací prostředí
- Scénáře s téměř nulovým souběžným přístupem

:::info{title=Tip}

- Tato konfigurace pouze zaručuje, že systém lze spustit; nezaručuje výkonnostní zážitek.
- Při nárůstu objemu dat nebo souběžných požadavků se systémové zdroje mohou rychle stát úzkým hrdlem.
- Pro **vývoj ze zdrojového kódu, vývoj pluginů nebo sestavení a nasazení ze zdrojového kódu** doporučujeme rezervovat **alespoň 4 GB volné paměti**, aby byla zajištěna úspěšná instalace závislostí, kompilace a proces sestavení.

:::

### Doporučené hardwarové požadavky

| Zdroj | Doporučená konfigurace |
|---|---|
| CPU | 2 jádra |
| Paměť | ≥ 4 GB |

**Vhodné scénáře**:

Vhodné pro malé a střední podniky a produkční prostředí s nízkým počtem souběžných uživatelů.

:::info{title=Tip}

- V této konfiguraci systém zvládne běžné operace v administraci a lehkou provozní zátěž.
- Při zvýšení složitosti procesů, souběžného přístupu nebo úloh na pozadí zvažte navýšení hardwarových specifikací nebo přechod na režim clusteru.

:::

## Režim clusteru

Vhodné pro středně velké a velké scénáře s vyšší mírou souběžnosti. Dostupnost a propustnost systému lze zvýšit horizontálním škálováním (podrobnosti naleznete v části: [Režim clusteru](/cluster-mode)).

### Hardwarové požadavky na uzel

V režimu clusteru se doporučuje, aby hardwarová konfigurace každého aplikačního uzlu (Pod / instance) odpovídala režimu nasazení na jednom uzlu.

**Minimální konfigurace uzlu:**

- CPU: 1 jádro
- Paměť: 2 GB

**Doporučená konfigurace uzlu:**

- CPU: 2 jádra
- Paměť: 4 GB

### Plánování počtu uzlů

- Počet uzlů v clusteru lze rozšířit podle potřeby (2–N).
- Skutečný počet potřebných uzlů závisí na:
  - Počtu souběžných přístupů
  - Složitosti obchodní logiky
  - Zátěži úloh na pozadí a asynchronního zpracování
  - Rychlosti odezvy externích závislých služeb

Doporučení pro produkční prostředí:

- Dynamicky upravujte počet uzlů na základě monitorovacích metrik (CPU, paměť, latence požadavků atd.).
- Ponechte si určitou rezervu zdrojů pro zvládnutí nárazového provozu.