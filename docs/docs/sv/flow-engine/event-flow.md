:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Händelseflöde

I FlowEngine är alla gränssnittskomponenter **händelsedrivna**.
Komponenternas beteende, interaktion och dataförändringar utlöses av händelser och utförs genom ett flöde.

## Statiska flöden kontra dynamiska flöden

I FlowEngine kan flöden delas in i två typer:

### **1. Statiskt flöde (Static Flow)**

- Definieras av utvecklare i koden;
- Verkar på **alla instanser av en modellklass**;
- Används ofta för att hantera den generella logiken för en modellklass;

### **2. Dynamiskt flöde (Dynamic Flow)**

- Konfigureras av användare i gränssnittet;
- Gäller endast för en specifik instans;
- Används ofta för anpassat beteende i specifika scenarier;

Kort sagt: **Ett statiskt flöde är en logikmall definierad på en klass, medan ett dynamiskt flöde är anpassad logik definierad på en instans.**

## Kopplingsregler kontra dynamiska flöden

I FlowEngines konfigurationssystem finns det två sätt att implementera händelselogik:

### **1. Kopplingsregler (Linkage Rules)**

- Är **inkapslingar av inbyggda händelseflödessteg**;
- Enklare att konfigurera och mer semantiska;
- I grunden är de fortfarande en förenklad form av ett **händelseflöde**.

### **2. Dynamiskt flöde (Dynamic Flow)**

- Kompletta konfigurationsmöjligheter för flöden;
- Anpassningsbara:
  - **Trigger (on)**: Definierar när det ska utlösas;
  - **Exekveringssteg (steps)**: Definierar logiken som ska utföras;
- Lämpliga för mer komplex och flexibel affärslogik.

Därför är **Kopplingsregler ≈ Förenklat händelseflöde**, och deras kärnmekanismer är konsekventa.

## Konsekvens i FlowAction

Både **Kopplingsregler** och **Händelseflöden** bör använda samma uppsättning **FlowActions**.
Det vill säga:

- En **FlowAction** definierar de åtgärder som kan anropas av ett flöde;
- Båda delar ett och samma åtgärdssystem, istället för att implementera två separata;
- Detta säkerställer återanvändning av logik och konsekvent utökning.

## Konceptuell hierarki

Konceptuellt ser FlowModels kärnrelation ut så här:

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── Globala händelser
      │     └── Lokala händelser
      └── FlowActionDefinition
            ├── Globala åtgärder
            └── Lokala åtgärder
```

### Hierarkibeskrivning

- **FlowModel**  
  Representerar en modellenhet med konfigurerbar och körbar flödeslogik.

- **FlowDefinition**  
  Definierar en komplett uppsättning flödeslogik (inklusive triggervillkor och exekveringssteg).

- **FlowEventDefinition**  
  Definierar flödets triggerkälla, inklusive:
  - **Globala händelser**: såsom applikationsstart, slutförd dataladdning;
  - **Lokala händelser**: såsom fältändringar, knappklick.

- **FlowActionDefinition**  
  Definierar flödets körbara åtgärder, inklusive:
  - **Globala åtgärder**: såsom att uppdatera sidan, globala meddelanden;
  - **Lokala åtgärder**: såsom att ändra fältvärden, växla komponentstatus.

## Sammanfattning

| Koncept | Syfte | Omfattning |
|------|------|-----------|
| **Statiskt flöde (Static Flow)** | Flödeslogik definierad i kod | Alla instanser av XXModel |
| **Dynamiskt flöde (Dynamic Flow)** | Flödeslogik definierad i gränssnittet | En enskild FlowModel-instans | 
| **FlowEvent** | Definierar triggern (när den ska utlösas) | Global eller lokal | 
| **FlowAction** | Definierar exekveringslogiken | Global eller lokal |
| **Kopplingsregel (Linkage Rule)** | Förenklad inkapsling av händelseflödessteg | Block-, åtgärdsnivå |