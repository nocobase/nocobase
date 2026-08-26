# Kapitel 6: Benutzer und Berechtigungen

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113595157318206&bvid=BV1EwiUYYE4f&cid=27181319746&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

In der Teamarbeit sollte jede Person ihre Aufgaben und Befugnisse klar kennen, damit die Arbeit reibungslos voranschreitet. In diesem Kapitel lernen wir das Anlegen von Rollen und die Verwaltung von Berechtigungen, um die Zusammenarbeit harmonischer und strukturierter zu gestalten.

Keine Sorge, der Prozess ist nicht kompliziert. Wir gehen Schritt für Schritt vor und führen Sie an jeder wichtigen Stelle. Bei Fragen können Sie sich jederzeit an unser offizielles Forum wenden.

### Anforderungen klären:

Wir benötigen die Rolle „Partner“. Diese Rolle hat bestimmte Berechtigungen, um an der Aufgabenverwaltung teilzunehmen, kann aber Aufgaben anderer nicht beliebig ändern. So lassen sich Aufgabenverteilung und Zusammenarbeit flexibel gestalten.

![](https://static-docs.nocobase.com/241219-5-er.svg)

> **Rollen und Berechtigungen kurz erklärt:** Rollen und Berechtigungen sind ein wichtiger Mechanismus, um Benutzerzugriffe und -aktionen zu steuern und damit Sicherheit und Datenintegrität zu gewährleisten. Rollen lassen sich Benutzern zuordnen, ein Benutzer kann mehrere Rollen besitzen. Über Berechtigungseinstellungen lässt sich steuern, welche Aktionen ein Benutzer ausführen darf, welche Funktionen sichtbar sind usw. – ein zentrales Mittel der Zugriffskontrolle.
> Mit Rollen und Berechtigungen, die mit Benutzern verknüpft werden, behalten Sie als Administrator die volle Kontrolle: Sie bestimmen, wer welche Operationen im System ausführen darf!

### 6.1 **Rollen erstellen und zuordnen**

#### 6.1.1 **Rolle „Partner“ anlegen**

- Klicken Sie oben rechts auf [„**Benutzer und Berechtigungen**“](https://docs-cn.nocobase.com/handbook/users) und wählen Sie [„**Rollen und Berechtigungen**“](https://docs-cn.nocobase.com/handbook/acl). Hier konfigurieren wir Rollen und verwalten Berechtigungen.
- Klicken Sie auf „**Rolle erstellen**“. Es erscheint ein Dialog. Benennen Sie die Rolle als **Partner** und bestätigen Sie das Speichern.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172222974.gif)

Sie haben erfolgreich eine neue Rolle angelegt. Als Nächstes verteilen wir die Berechtigungen, damit dieser Rolle die Teilnahme an der Aufgabenverwaltung möglich ist.

#### 6.1.2 **Neue Rolle dem eigenen Konto zuordnen**

Damit unsere Rolleneinstellungen wirken, weisen wir die Rolle zum Testen unserem eigenen Konto zu. Sehr einfach:

- Suchen Sie in der Benutzerverwaltung Ihr Konto, öffnen Sie es, wählen Sie „**Rolle zuordnen**“ und wählen Sie „**Partner**“ aus.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223483.gif)

Damit können Sie mit Ihrem eigenen Konto die Rolle „Partner“ simulieren. Schauen wir nun, wie der Rollenwechsel funktioniert.

#### 6.1.3 **Zur Rolle „Partner“ wechseln**

Sie haben die Rolle „Partner“ zugeordnet. Wechseln wir nun die Rolle.

- Klicken Sie oben rechts auf das **persönliche Center** und wählen Sie „**Rolle wechseln**“.
- Möglicherweise sehen Sie die Rolle „Partner“ noch nicht in der Liste. Keine Sorge – aktualisieren Sie einfach die Seite/den Cache, dann wird die Rolle angezeigt.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223922.gif)

### 6.2 Seitenberechtigungen für Rollen vergeben

Nach dem Wechsel zur Rolle „Partner“ stellen Sie vielleicht fest, dass keine Seiten und Menüs angezeigt werden. Das liegt daran, dass dieser Rolle bisher keine Zugriffsberechtigungen für bestimmte Seiten zugeordnet wurden. Kein Problem – das holen wir nun nach.

#### 6.2.1 **Zugriff auf die Aufgabenseite für „Partner“ vergeben**

- Wechseln Sie zunächst zur Rolle **Root** (Super-Administrator) und öffnen Sie „**Rollen und Berechtigungen**“.
- Klicken Sie auf die Rolle „Partner“, um deren Konfigurationsseite zu öffnen. Dort sehen Sie den Tab „**Menü**“ – das sind alle Seiten des Systems.
- Aktivieren Sie das Häkchen bei „**Aufgabenverwaltung**“, damit „Partner“ Zugriff auf die Aufgabenverwaltungsseite erhält.

Zurück im **persönlichen Center** wechseln Sie erneut zur Rolle „Partner“ – nun sollte der Menüpunkt „Aufgabenverwaltung“ sichtbar sein.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223592.gif)

#### 6.2.2 Berechtigungen für Datentabellen und Actions konfigurieren

Die Rolle „Partner“ kann nun zwar auf die Aufgabenverwaltungsseite zugreifen, doch wir möchten ihre Berechtigungen weiter eingrenzen. Konkret soll „Partner“:

- die ihm zugewiesenen Aufgaben **anzeigen und bearbeiten** dürfen;
- den **Aufgabenfortschritt aktualisieren** dürfen;
- aber **keine Aufgaben anlegen oder löschen** dürfen.

Dafür konfigurieren wir die Berechtigungen der „Aufgabentabelle“. Auf geht’s!

##### 6.2.2.1 **Berechtigungen für die Datentabelle der Rolle „Partner“ konfigurieren**

- Öffnen Sie „**Rollen und Berechtigungen**“, klicken Sie auf „Partner“ und wechseln Sie zum Tab „**Datenquelle**“.
- Hier sehen Sie „**Berechtigungen für Datentabellen-Operationen**“. Suchen Sie die „**Aufgabentabelle**“ und vergeben Sie für „Partner“ die Berechtigungen „Anzeigen“ und „Bearbeiten“.
- Warum als Bearbeiten-Bereich „alle Daten“? Wir geben „Partner“ vorübergehend die volle Bearbeiten-Berechtigung. Später schränken wir die Felder dynamisch je nach „Aufgabenverantwortlichem“ ein.
  Damit schaffen wir maximale Flexibilität für die spätere feinere Steuerung.
- „Hinzufügen“ und „Löschen“ wollen wir anderen Rollen nicht öffnen, daher vergeben wir diese gar nicht erst.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224941.gif)

Damit kann die Rolle „Partner“ alle Aufgaben anzeigen und bearbeiten. Im nächsten Schritt verfeinern wir die Steuerung, damit „Partner“ wirklich nur die ihm zugewiesenen Aufgaben bearbeiten kann.

### 6.3 Feld „Verantwortlich“ für Aufgaben hinzufügen

Als Nächstes weisen wir jeder Aufgabe einen Verantwortlichen zu. So stellen wir sicher, dass nur der Verantwortliche die Aufgabe ändern kann, andere können sie nur ansehen. Dafür benötigen wir ein **Beziehungsfeld**, das die Aufgabentabelle mit der Benutzertabelle verbindet.

#### 6.3.1 **Feld „Verantwortlich“ anlegen**

1. Öffnen Sie die **Aufgabentabelle**, klicken Sie auf „**Feld hinzufügen**“ und wählen Sie „**Beziehungsfeld**“.
2. Wählen Sie eine **Viele-zu-Eins**-Beziehung (eine Aufgabe hat genau einen Verantwortlichen, ein Benutzer kann jedoch mehrere Aufgaben verantworten).
3. Nennen Sie das Feld **Verantwortlich (Assignee)**. Die Reverse-Beziehung benötigen wir vorerst nicht.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224751.gif)

#### 6.3.2 **Feld „Verantwortlich“ anzeigen**

Stellen Sie sicher, dass das Feld „Verantwortlich“ in den Tabellen und Formularen der Aufgabenverwaltungsseite angezeigt wird, damit Sie jeder Aufgabe einen Verantwortlichen zuweisen können. (Falls die ID statt der Bezeichnung angezeigt wird, ändern Sie das Titelfeld einfach von „ID“ auf „Spitzname“.)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224547.png)

### 6.4 Berechtigungen über die **Berechtigungsverwaltung** steuern

Jetzt der spannendste Teil! Mit der [**Berechtigungsverwaltung**](https://docs-cn.nocobase.com/handbook/acl) von NocoBase realisieren wir eine starke Funktion: **Nur der Verantwortliche und der Ersteller einer Aufgabe dürfen sie bearbeiten**, alle anderen sehen sie nur. Die nächste Stärke von NocoBase wird sichtbar.

#### 6.4.1 **Erster Versuch: nur der Verantwortliche darf das Formular bearbeiten**

Wir möchten, dass nur der Verantwortliche eine Aufgabe bearbeiten darf. Dafür konfigurieren wir folgende Bedingung:

- Zurück in den Tabellenrechten der Rolle „Partner“: Öffnen Sie die „Konfiguration“ der Aufgabentabelle und klicken Sie hinter „Bearbeiten-Berechtigung“ auf „Datenbereich“.
- Legen Sie eine neue benutzerdefinierte Regel mit dem Namen „Verantwortlicher darf bearbeiten“ an:
  Bedingung: **Wenn „Verantwortlich/ID“ gleich „Aktueller Benutzer/ID“ ist**, darf bearbeitet werden.
  Damit darf nur der Verantwortliche die Aufgabe bearbeiten, alle anderen sehen sie nur.
- Da unser Feld „Verantwortlich“ auf der Benutzertabelle basiert und der angemeldete Benutzer ebenfalls in der Benutzertabelle ist, erfüllt diese Regel unsere erste Anforderung perfekt.

Klicken Sie auf „Hinzufügen“ und bestätigen Sie.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172226879.gif)

Zurück auf der Seite:

Nun wechseln wir zur Rolle „Partner“ und prüfen das Ergebnis: Nur wenn wir selbst der Verantwortliche sind, wird die Bearbeiten-Action sichtbar.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227581.gif)

#### 6.4.2 **Zusatzbedingung: Ersteller darf das Formular bearbeiten**

Möglicherweise fällt Ihnen schnell ein neues Problem auf:

Bei den meisten Aufgaben sind wir nicht der Verantwortliche, können das Formular also nicht bearbeiten – und auch andere Mitwirkende sehen die Aufgabendetails nicht!

Keine Sorge: Erinnern Sie sich, dass wir „Partner“ die **Anzeigen**-Berechtigung für alle Daten gegeben haben?

- Zurück auf der Seite, fügen wir in der Konfiguration über „Anzeigen“ eine neue Anzeigen-Action hinzu.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227426.png)

- Layout des Anzeigen-Popups ähnlich dem Bearbeiten-Popup gestalten – wichtig: einen **Detail**-Block wählen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227807.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227352.gif)

Geschafft!

### 6.5 **Berechtigungssteuerung verifizieren**

Wenn Sie zwischen verschiedenen Benutzern wechseln und die Formulare ansehen, sehen Sie, dass die Formular-Blocks anhand der Benutzerrechte automatisch unterschiedliche Aktionen zeigen. Für Aufgaben, deren Verantwortlicher Sie sind, ist die Bearbeiten-Action verfügbar; für andere Aufgaben gibt es nur die Anzeigen-Action.

Beim Wechsel zur Rolle Root erhalten Sie wieder volle Rechte – das ist die Stärke der Berechtigungsverwaltung von NocoBase!

Nun können Sie nach Belieben Aufgaben zuweisen und mit Ihrem Team zusammenarbeiten. Fügen wir dem Team ein neues Mitglied hinzu und prüfen, ob unsere Berechtigungen korrekt funktionieren.

#### 6.5.1 **Neuen Benutzer anlegen und Rolle zuweisen**

- Legen Sie einen neuen Benutzer an, etwa **Tom**, und weisen Sie die Rolle **Partner** zu.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172228278.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172228648.gif)

- Weisen Sie Tom auf der Aufgabenverwaltungsseite einige Aufgaben zu.

#### 6.5.2 **Login-Test**

Lassen Sie Tom sich anmelden und prüfen, ob er die ihm zugewiesenen Aufgaben sehen und bearbeiten kann. Gemäß den Berechtigungsregeln sollte Tom nur seine eigenen Aufgaben bearbeiten können – alle anderen sind für ihn nur lesbar.

Die Bearbeiten-Berechtigung des Formulars ist auf allen Seiten erfolgreich synchronisiert.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172229408.gif)

### Zusammenfassung

Glückwunsch! Sie haben in NocoBase Rollen erstellt, Berechtigungen vergeben und individuelle Zugriffsregeln konfiguriert, sodass Teammitglieder nur die ihnen zugewiesenen Aufgaben bearbeiten können. Damit haben Sie ein klares, strukturiertes Berechtigungssystem für die Teamarbeit aufgebaut.

### Bonusaufgabe

Tom kann jetzt die ihm zugewiesenen Aufgaben anzeigen und bearbeiten – aber Sie haben vielleicht bemerkt, dass **er noch keine Kommentare schreiben** kann und nicht aktiv an Diskussionen teilnehmen kann. Wie ermöglichen wir Tom, sich frei zu äußern und mitzudiskutieren? Eine spannende Bonusaufgabe!

**Hinweis zur Bonusaufgabe:**

Versuchen Sie, in den Rollenrechten der Rolle „Partner“ die Berechtigungen anzupassen, etwa für die zugehörigen Datentabellen. Ziel ist es, Tom Kommentar-Rechte zu geben, ohne seine Einschränkungen bei den anderen Aufgaben zu kompromittieren.

Probieren Sie es aus! Die Antwort gibt’s im nächsten Abschnitt.

Im nächsten Kapitel realisieren wir außerdem die Funktion „Mitglieder-Aktivität“ und lernen ein weiteres starkes Modul kennen: den [**Workflow**](https://docs-cn.nocobase.com/handbook/workflow). Mit Workflows lassen sich Daten dynamisch verarbeiten und Aktionen automatisch auslösen. Bereit für mehr? Wir sehen uns in [Kapitel 7: Workflow – Automatisierung steigert die Effizienz](https://www.nocobase.com/cn/blog/task-tutorial-workflow)!

---

Erkunden Sie weiter und lassen Sie Ihrer Kreativität freien Lauf! Bei Problemen können Sie jederzeit in der [offiziellen NocoBase-Dokumentation](https://docs-cn.nocobase.com/) nachlesen oder in der [NocoBase-Community](https://forum.nocobase.com/) diskutieren.
