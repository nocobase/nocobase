# Feldvalidierung
Um die Genauigkeit, Sicherheit und Konsistenz Ihrer Sammlungen zu gewährleisten, bietet NocoBase eine Funktion zur Feldvalidierung. Diese Funktion gliedert sich hauptsächlich in zwei Bereiche: die Konfiguration von Regeln und die Anwendung dieser Regeln.

## Regelkonfiguration
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)
Die NocoBase Systemfelder integrieren [Joi](https://joi.dev/api/)-Regeln. Die Unterstützung sieht wie folgt aus:

### String-Typ
Joi String-Typen entsprechen den folgenden NocoBase Feldtypen: Einzeiliger Text, Mehrzeiliger Text, Telefonnummer, E-Mail, URL, Passwort und UUID.
#### Allgemeine Regeln
- Minimale Länge
- Maximale Länge
- Länge
- Regulärer Ausdruck
- Erforderlich

#### E-Mail
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[Weitere Optionen anzeigen](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[Weitere Optionen anzeigen](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[Weitere Optionen anzeigen](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Zahlentyp
Joi Zahlentypen entsprechen den folgenden NocoBase Feldtypen: Ganzzahl, Zahl und Prozentsatz.
#### Allgemeine Regeln
- Größer als
- Kleiner als
- Maximalwert
- Minimalwert
- Vielfaches

#### Ganzzahl
Zusätzlich zu den allgemeinen Regeln unterstützen Ganzzahlfelder zusätzlich die [Ganzzahlvalidierung](https://joi.dev/api/?v=17.13.3#numberinteger) und die [unsichere Ganzzahlvalidierung](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Zahl & Prozentsatz
Zusätzlich zu den allgemeinen Regeln unterstützen Zahlen- und Prozentsatzfelder zusätzlich die [Genauigkeitsvalidierung](https://joi.dev/api/?v=17.13.3#numberinteger).
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Datumstyp
Joi Datumstypen entsprechen den folgenden NocoBase Feldtypen: Datum (mit Zeitzone), Datum (ohne Zeitzone), Nur Datum und Unix-Zeitstempel.

Unterstützte Validierungsregeln:
- Größer als
- Kleiner als
- Maximalwert
- Minimalwert
- Zeitstempel-Formatvalidierung
- Erforderlich

### Beziehungsfelder
Beziehungsfelder unterstützen lediglich die Pflichtfeldvalidierung. Beachten Sie bitte, dass die Pflichtfeldvalidierung für Beziehungsfelder derzeit in Szenarien mit Unterformularen oder Untertabellen nicht unterstützt wird.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Anwendung von Validierungsregeln
Nachdem Sie Feldregeln konfiguriert haben, werden die entsprechenden Validierungsregeln beim Hinzufügen oder Ändern von Daten ausgelöst.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Wenn das Feld in einem Formular verwendet wird, werden die Feldvalidierungsregeln auch in den Validierungseinstellungen des Feldes angezeigt. Diese Regeln erscheinen unter **Serverseitige Feldvalidierungsregeln** und sind dort schreibgeschützt. Wenn Sie sie ändern müssen, bearbeiten Sie das Feld unter Datenquelle → Sammlungskonfiguration.

Unter **Clientseitige Validierungsregeln** können Sie weiterhin zusätzliche Regeln für das aktuelle Formularfeld hinzufügen. Diese Regeln gelten nur für die aktuelle Feldkomponente. Das endgültige Validierungsergebnis kombiniert **Serverseitige Feldvalidierungsregeln** und **Clientseitige Validierungsregeln**.

Validierungsregeln gelten auch für Untertabellen- und Unterformular-Komponenten:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)
![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)
Beachten Sie bitte, dass in Szenarien mit Unterformularen oder Untertabellen die Pflichtfeldvalidierung für Beziehungsfelder derzeit nicht wirksam ist.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Unterschiede zwischen serverseitigen Feldvalidierungsregeln und clientseitigen Validierungsregeln
Serverseitige Feldvalidierungsregeln und clientseitige Validierungsregeln werden an unterschiedlichen Stellen konfiguriert und haben unterschiedliche Geltungsbereiche.

### Unterschiede in der Konfigurationsmethode
- **Serverseitige Feldvalidierungsregeln**: Legen Sie Feldregeln unter Datenquelle → Sammlungskonfiguration fest. Diese Regeln sind die Basisregeln des Feldes.
- **Clientseitige Validierungsregeln**: Konfigurieren Sie zusätzliche Regeln in den Einstellungen eines Formularfeldes. Diese Regeln wirken sich nur auf die aktuelle Feldkomponente aus.
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)
![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### Unterschiede im Zeitpunkt der Validierungsauslösung
- **Serverseitige Feldvalidierungsregeln**: Lösen eine Frontend-Validierung aus, wenn das Feld in einem Formular verwendet wird, und validieren auch vor dem Schreiben der Daten. Sie gelten auch für Szenarien, in denen Daten erstellt oder aktualisiert werden, etwa Workflows und Datenimporte.
- **Clientseitige Validierungsregeln**: Lösen die Frontend-Validierung nur im aktuellen Formularfeld aus.
- **Regelanzeige**: Serverseitige Feldvalidierungsregeln werden als geerbte, schreibgeschützte Regeln angezeigt. Clientseitige Validierungsregeln werden separat angezeigt und können dort bearbeitet werden.
- **Fehlermeldungen**: Clientseitige Validierungsregeln unterstützen benutzerdefinierte Fehlermeldungen, während serverseitige Feldvalidierungsregeln derzeit keine benutzerdefinierten Fehlermeldungen unterstützen.
