# Markdown-Vorlagenvariablen verwenden

Willkommen zu diesem Tutorial! Wir lernen Schritt für Schritt, wie Sie mit Markdown und der Handlebars-Template-Engine dynamische Inhalte anzeigen. In „Tipps zum Markdown-Block" haben Sie bereits Grundlagen, Erstellung und Variablen kennengelernt - hier vertiefen wir die fortgeschrittene Verwendung von Vorlagenvariablen.

## 1 Template-Engine [Handlebars](https://docs-cn.nocobase.com/handbook/template-handlebars) im Überblick

Wenn Sie einen Markdown-Block angelegt haben, sehen Sie oben rechts in den Einstellungen die Option „Template Engine" - Standard ist Handlebars. Damit können Sie Inhalte abhängig von Bedingungen darstellen, sodass Markdown auf Veränderungen reagiert.

![Template-Engine](https://static-docs.nocobase.com/20250304011925.png)

### 1.1 Aufgabe von Handlebars

Während Markdown nativ nur statische Inhalte zeigt, können Sie mit Handlebars Texte und Stile abhängig von Bedingungen (z. B. Status, Zahl, Auswahl) dynamisch wechseln. Selbst in stark variablen Geschäftssituationen bleibt die Seite stets aktuell.

## 2 Praktische Anwendungsfälle

Wir betrachten einige nützliche Szenarien und setzen sie Schritt für Schritt um.

### 2.1 Auftragsstatus behandeln

Im Online-Demo zeigen wir abhängig vom Auftragsstatus unterschiedliche Hinweise. Angenommen, Ihre Auftragstabelle hat ein Statusfeld:

![Statusfeld](https://static-docs.nocobase.com/20250304091420.png)

Die vier Status entsprechen folgenden Inhalten:


| Optionsname        | Wert | Anzeige                                                                              |
| ------------------ | ---- | ------------------------------------------------------------------------------------ |
| Pending Approval   | 1    | Auftrag eingereicht, wartet auf interne Prüfung.                                     |
| Pending Payment    | 2    | Wartet auf Zahlung. Bitte den Auftragsstatus im Blick behalten.                      |
| Paid               | 3    | Zahlung bestätigt, weiter bearbeiten. Berater meldet sich innerhalb 1 Stunde.        |
| Rejected           | 4    | Auftrag abgelehnt. Bei Bedarf prüfen und neu einreichen.                             |

Auf der Seite holen wir den Statuswert ab und zeigen abhängig davon Inhalte. Im Folgenden zeigen wir die Verwendung von if, else und else if.

#### 2.1.1 if-Syntax

Mit `if` zeigen Sie Inhalte, die einer Bedingung entsprechen:

```
{{#if Bedingung}}
  <p>Inhalt anzeigen</p>
{{/if}}
```

Die Bedingung verwendet Handlebars-Syntax (eq, gt, lt usw.). Beispiel:

```
{{#if (eq 1 1)}}
  <p>Anzeige: 1 = 1</p>
{{/if}}
```

Beispielresultat:

![if Beispiel 1](https://static-docs.nocobase.com/20250305115416.png)
![if Beispiel 2](https://static-docs.nocobase.com/20250305115434.png)

#### 2.1.2 else-Syntax

Schlägt die Bedingung fehl, geben Sie mit `else` einen Alternativinhalt aus:

```
{{#if (eq 1 2)}}
  <p>Anzeige: 1 = 2</p>
{{else}}
  <p>Anzeige: 1 ≠ 2</p>
{{/if}}
```

Beispiel:

![else Beispiel](https://static-docs.nocobase.com/20250305115524.png)

#### 2.1.3 Mehrfachbedingungen

Für mehrere Bedingungen verwenden Sie `else if`:

```
{{#if (eq 1 7)}}
  <p>Anzeige: 1 = 7</p>
{{else if (eq 1 5)}}
  <p>Anzeige: 1 = 5</p>
{{else if (eq 1 4)}}
  <p>Anzeige: 1 = 4</p>
{{else}}
  <p>Anzeige: 1 ≠ 7 ≠ 5 ≠ 3</p>
{{/if}}
```

Beispiel:

![Mehrfachbedingung](https://static-docs.nocobase.com/20250305115719.png)

### 2.2 Effekt

Nach der Konfiguration wechselt die Seite je nach Auftragsstatus dynamisch die Anzeige:

![Auftragsstatus-Animation](https://static-docs.nocobase.com/202503040942-handlebar1.gif)

Code auf der Seite:

```
{{#if order.status}}
  <div>
    {{#if (eq order.status "1")}}
      <span style="color: orange;">⏳ Pending Approval</span>
      <p>Auftrag eingereicht, wartet auf interne Prüfung.</p>
    {{else if (eq order.status "2")}}
      <span style="color: #1890ff;">💳 Pending Payment</span>
      <p>Wartet auf Zahlung. Bitte den Auftragsstatus im Blick behalten.</p>
    {{else if (eq order.status "3")}}
      <span style="color: #52c41a;">✔ Paid</span>
      <p>Zahlung bestätigt, weiter bearbeiten. Berater meldet sich innerhalb 1 Stunde.</p>
    {{else if (eq order.status "4")}}
      <span style="color: #f5222d;">✖ Rejected</span>
      <p>Auftrag abgelehnt. Bei Bedarf prüfen und neu einreichen.</p>
    {{/if}}
  </div>
{{else}}
  <p class="empty-state">Keine offenen Aufträge.</p>
{{/if}}
```

Wechseln Sie den Auftragsstatus und beobachten Sie, ob die Seite passend reagiert, um Ihren Code zu verifizieren.

### 2.3 Auftragspositionen anzeigen

Neben dem Status werden Auftragspositionen (z. B. Produktlisten) häufig benötigt. Nutzen Sie hierfür `each`:

#### 2.3.1 Grundlagen von each

Mit `each` iterieren Sie über eine Liste, z. B. das Array `[1,2,3]`:

```
{{#each Liste}}
  <p>Anzeige: {{this}}</p>
  <p>Index: {{@index}}</p>
{{/each}}
```

Im Schleifeninneren steht `{{this}}` für das aktuelle Element, `{{@index}}` für den aktuellen Index.

#### 2.3.2 Beispiel: Produktdetails

Möchten Sie alle Produkte eines Auftrags anzeigen:

```
{{#each $nRecord.order_items}}
    <p>{{@index}}</p>
    <p>{{this.id}}</p>
    <p>{{this.price}}</p>
    <p>{{this.quantity}}</p>
    <p>{{this.product.name}}</p>
---
{{/each}}
```

Falls keine Daten erscheinen, prüfen Sie, ob das Feld der Auftragspositionen korrekt eingebunden ist - andernfalls wertet das System sie als nicht abrufbar.
![20250305122543_handlebar_each](https://static-docs.nocobase.com/20250305122543_handlebar_each.gif)

Möglicherweise wird der Produktname (`product.name`) nicht ausgegeben - aus demselben Grund: Wir müssen das Produktobjekt ebenfalls anzeigen lassen.
![20250305122543_each2](https://static-docs.nocobase.com/20250305122543_each2.gif)

Anschließend können wir es per Linkage-Regel wieder ausblenden:
![20250305122543_hidden_each](https://static-docs.nocobase.com/20250305122543_hidden_each.gif)

### 2.4 Endprodukt: Produktliste eines Auftrags

Mit den obigen Schritten erhalten Sie eine vollständige Anzeige der Auftragspositionen:

```
### Auftragspositionen

{{#if $nRecord.order_items}}
  <div class="cart-summary">Gesamt: {{$nRecord.order_items.length}} Artikel, Preis: ¥{{$nRecord.total}}</div>
  
  <table>
    <thead>
      <tr>
        <th>Nr.</th>
        <th>Produktname</th>
        <th>Stückpreis</th>
        <th>Menge</th>
        <th>Summe</th>
      </tr>
    </thead>
    <tbody>
      {{#each $nRecord.order_items}}
        <tr style="{{#if this.out_of_stock}}color: red;{{/if}}">
          <td>{{@index}}</td>
          <td>{{this.product.name}}</td>
          <td>¥{{this.price}}</td>
          <td>{{this.quantity}}</td>
          <td>¥{{multiply this.price this.quantity}}</td>
          <td>
            {{#if this.out_of_stock}}
              <span>Nicht verfügbar</span>
            {{else if this.low_stock}}
              <span style="color:orange;">Bestand knapp</span>
            {{/if}}
          </td>
        </tr>
      {{/each}}
    </tbody>
  </table>
{{else}}
  <p>Auftrag ist leer</p>
{{/if}}
```

Resultat:

![Produktliste-Resultat](https://static-docs.nocobase.com/20250305124125.png)

Zur Demonstration der Flexibilität von Handlebars haben wir in den Auftragsdetails die Felder „out_of_stock" und „low_stock" ergänzt:

- Bei `out_of_stock = true` wird „Nicht verfügbar" angezeigt und die Zeile rot eingefärbt.
- Bei `low_stock = true` erscheint rechts „Bestand knapp" in Orange.

![Zusatz-Effekt: Nicht verfügbar / Bestand knapp](https://static-docs.nocobase.com/20250305130258.png)

## 3 Zusammenfassung und Empfehlungen

Sie haben gelernt, wie Sie Markdown mit Handlebars dynamisch rendern - mit if/else, each und weiteren Kernsyntaxelementen. Für komplexe Logik kombinieren Sie diese mit Linkage-Regeln, berechneten Feldern, Workflows oder Skript-Knoten.

Wir hoffen, Sie üben fleißig und wenden diese Techniken in Ihren Projekten an. Erkunden Sie weitere Möglichkeiten!

---

Bei Fragen während der Umsetzung sind Sie im [NocoBase Community-Forum](https://forum.nocobase.com) willkommen oder können die [offizielle Dokumentation](https://docs-cn.nocobase.com) konsultieren. Viel Erfolg!
