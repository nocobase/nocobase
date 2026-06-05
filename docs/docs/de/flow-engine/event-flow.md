:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Ereignisfluss

Im FlowEngine sind alle Komponenten der Benutzeroberfläche **ereignisgesteuert**. Das Verhalten, die Interaktionen und Datenänderungen von Komponenten werden durch Ereignisse ausgelöst und über einen Flow ausgeführt.

## Statische Flows vs. Dynamische Flows

Im FlowEngine können Flows in zwei Typen unterteilt werden:

### **1. Statische Flows**

- Werden von Entwicklern im Code definiert;
- Wirken sich auf **alle Instanzen einer Model-Klasse** aus;
- Werden häufig verwendet, um die allgemeine Logik einer Model-Klasse zu verwalten;

### **2. Dynamische Flows**

- Werden von Benutzern über die Benutzeroberfläche konfiguriert;
- Gelten nur für eine spezifische Instanz;
- Werden häufig für personalisiertes Verhalten in bestimmten Szenarien eingesetzt;

Kurz gesagt: **Ein statischer Flow ist eine auf einer Klasse definierte Logikvorlage, während ein dynamischer Flow eine auf einer Instanz definierte personalisierte Logik ist.**

## Verknüpfungsregeln vs. Dynamische Flows

Im Konfigurationssystem des FlowEngine gibt es zwei Möglichkeiten, Ereignislogik zu implementieren:

### **1. Verknüpfungsregeln**

- Sind **Kapselungen von integrierten Ereignis-Flow-Schritten**;
- Sind einfacher zu konfigurieren und semantisch aussagekräftiger;
- Stellen im Wesentlichen immer noch eine vereinfachte Form eines **Ereignisflusses (Flow)** dar.

### **2. Dynamische Flows**

- Bieten vollständige Flow-Konfigurationsmöglichkeiten;
- Sind anpassbar:
  - **Trigger (on)**: Definiert, wann ausgelöst werden soll;
  - **Ausführungsschritte (steps)**: Definieren die auszuführende Logik;
- Eignen sich für komplexere und flexiblere Geschäftslogik.

Daher gilt: **Verknüpfungsregeln ≈ Vereinfachter Ereignisfluss**, und ihre Kernmechanismen sind konsistent.

## Konsistenz von FlowAction

Sowohl **Verknüpfungsregeln** als auch **Ereignisflüsse** sollten denselben Satz von **FlowActions** verwenden. Das bedeutet:

- Eine **FlowAction** definiert die Aktionen, die von einem Flow aufgerufen werden können;
- Beide teilen sich ein Aktionssystem, anstatt zwei separate zu implementieren;
- Dies gewährleistet die Wiederverwendbarkeit der Logik und eine konsistente Erweiterung.

## Konzeptuelle Hierarchie

Konzeptionell stellt sich die Kernbeziehung des FlowModels wie folgt dar:

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── Globale Ereignisse
      │     └── Lokale Ereignisse
      └── FlowActionDefinition
            ├── Globale Aktionen
            └── Lokale Aktionen
```

### Hierarchiebeschreibung

- **FlowModel**  
  Stellt eine Modellentität mit konfigurierbarer und ausführbarer Flow-Logik dar.

- **FlowDefinition**  
  Definiert einen vollständigen Satz von Flow-Logik (einschließlich Trigger-Bedingungen und Ausführungsschritten).

- **FlowEventDefinition**  
  Definiert die Trigger-Quelle des Flows, einschließlich:
  - **Globale Ereignisse**: wie Anwendungsstart, Abschluss des Datenladens;
  - **Lokale Ereignisse**: wie Feldänderungen, Schaltflächenklicks.

- **FlowActionDefinition**  
  Definiert die ausführbaren Aktionen des Flows, einschließlich:
  - **Globale Aktionen**: wie Seitenaktualisierung, globale Benachrichtigungen;
  - **Lokale Aktionen**: wie Ändern von Feldwerten, Umschalten des Komponentenstatus.

## Zusammenfassung

| Konzept | Zweck | Geltungsbereich |
|------|------|-----------|
| **Statischer Flow** | Im Code definierte Flow-Logik | Alle Instanzen von XXModel |
| **Dynamischer Flow** | Auf der Benutzeroberfläche definierte Flow-Logik | Eine einzelne FlowModel-Instanz | 
| **FlowEvent** | Definiert den Trigger (wann ausgelöst werden soll) | Global oder lokal | 
| **FlowAction** | Definiert die Ausführungslogik | Global oder lokal |
| **Verknüpfungsregel** | Vereinfachte Kapselung von Ereignis-Flow-Schritten | Block-, Aktionsebene |