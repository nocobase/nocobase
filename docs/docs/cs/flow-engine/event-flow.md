:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Tok událostí

Ve FlowEngine jsou všechny komponenty rozhraní **řízeny událostmi (Event-driven)**. Chování, interakce a změny dat komponent jsou spouštěny událostmi (Event) a prováděny prostřednictvím toku (Flow).

## Statický tok vs. Dynamický tok

Ve FlowEngine se toky (Flow) dělí na dva typy:

### **1. Statický tok (Static Flow)**

- Definován vývojáři v kódu;
- Působí na **všechny instance třídy Model**;
- Často se používá pro zpracování obecné logiky třídy Model;

### **2. Dynamický tok (Dynamic Flow)**

- Konfigurován uživateli v rozhraní;
- Působí pouze na konkrétní instanci;
- Často se používá pro personalizované chování v konkrétních scénářích;

Stručně řečeno: **Statický tok je logická šablona definovaná na třídě, zatímco dynamický tok je personalizovaná logika definovaná na instanci.**

## Pravidla propojení vs. Dynamický tok

V konfiguračním systému FlowEngine existují dva způsoby, jak implementovat logiku událostí:

### **1. Pravidla propojení (Linkage Rules)**

- Jsou **zapouzdřením vestavěných kroků toku událostí**;
- Jednodušší na konfiguraci a s výraznější sémantikou;
- V podstatě se stále jedná o zjednodušenou formu **toku událostí (Flow)**.

### **2. Dynamický tok (Dynamic Flow)**

- Kompletní konfigurační možnosti toku;
- Lze přizpůsobit:
  - **Spouštěč (on)**: Definuje, kdy se má spustit;
  - **Kroky provedení (steps)**: Definuje logiku, která se má provést;
- Vhodné pro složitější a flexibilnější obchodní logiku.

Proto **Pravidla propojení ≈ Zjednodušený tok událostí**, a jejich základní mechanismy jsou konzistentní.

## Konzistence FlowAction

Ať už se jedná o **Pravidla propojení** nebo **Toky událostí**, měly by používat stejnou sadu **FlowAction**. To znamená:

- **FlowAction** definuje akce, které mohou být volány tokem (Flow);
- Oba sdílejí jeden systém akcí, namísto implementace dvou samostatných;
- Tím je zajištěno opětovné použití logiky a konzistentní rozšíření.

## Konceptuální hierarchie

Konceptuálně je základní abstraktní vztah FlowModel následující:

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── Globální události (Global Events)
      │     └── Lokální události (Local Events)
      └── FlowActionDefinition
            ├── Globální akce (Global Actions)
            └── Lokální akce (Local Actions)
```

### Popis hierarchie

- **FlowModel**
  Představuje entitu modelu s konfigurovatelnou a spustitelnou logikou toku.

- **FlowDefinition**
  Definuje kompletní sadu logiky toku (včetně podmínek spouštění a kroků provedení).

- **FlowEventDefinition**
  Definuje zdroj spouštění toku, včetně:
  - **Globální události**: například spuštění aplikace, dokončení načítání dat;
  - **Lokální události**: například změny polí, kliknutí na tlačítka.

- **FlowActionDefinition**
  Definuje spustitelné akce toku, včetně:
  - **Globální akce**: například obnovení stránky, globální oznámení;
  - **Lokální akce**: například úprava hodnot polí, přepínání stavu komponent.

## Souhrn

| Koncept | Účel | Rozsah platnosti |
|------|------|-----------|
| **Statický tok (Static Flow)** | Logika toku definovaná v kódu | Všechny instance XXModel |
| **Dynamický tok (Dynamic Flow)** | Logika toku definovaná v rozhraní | Jednotlivá instance FlowModel |
| **FlowEvent** | Definuje spouštěč (kdy spustit) | Globální nebo lokální |
| **FlowAction** | Definuje logiku provedení | Globální nebo lokální |
| **Pravidla propojení (Linkage Rule)** | Zjednodušené zapouzdření kroků toku událostí | Úroveň bloku, akce |