---
pkg: '@nocobase/plugin-file-previewer-office'
---

:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/file-manager/file-preview/ms-office).
:::

# Aperçu de fichiers Office <Badge>v1.8.11+</Badge>

Le plugin Aperçu de fichiers Office est utilisé pour prévisualiser des fichiers au format Office dans les applications NocoBase, tels que Word, Excel et PowerPoint.  
Il repose sur un service en ligne public fourni par Microsoft, qui permet d'intégrer des fichiers accessibles via une URL publique dans une interface d'aperçu, permettant ainsi aux utilisateurs de consulter ces fichiers dans un navigateur sans avoir à les télécharger ni à utiliser les applications Office.

## Manuel d'utilisation

Par défaut, le plugin est à l'état **désactivé**. Il peut être utilisé après avoir été activé dans le gestionnaire de plugins, sans aucune configuration supplémentaire requise.

![Interface d'activation du plugin](https://static-docs.nocobase.com/20250731140048.png)

Après avoir téléchargé avec succès un fichier Office (Word / Excel / PowerPoint) dans un champ de fichier d'une collection, cliquez sur l'icône ou le lien du fichier correspondant pour visualiser le contenu dans l'interface d'aperçu contextuelle ou intégrée.

![Exemple d'opération d'aperçu](https://static-docs.nocobase.com/20250731143231.png)

## Principe de fonctionnement

L'aperçu intégré par ce plugin repose sur le service en ligne public de Microsoft (Office Web Viewer). Le processus principal est le suivant :

- Le frontend génère une URL accessible publiquement pour le fichier téléchargé par l'utilisateur (y compris les URL signées S3) ;
- Le plugin charge l'aperçu du fichier dans une iframe en utilisant l'adresse suivante :

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<URL publique du fichier>
  ```

- Le service de Microsoft demande le contenu du fichier à partir de cette URL, effectue le rendu et renvoie une page consultable.

## Remarques

- Étant donné que ce plugin dépend du service en ligne de Microsoft, assurez-vous que votre connexion réseau est normale et que les services associés de Microsoft sont accessibles.
- Microsoft accèdera à l'URL du fichier que vous fournissez, et le contenu du fichier sera brièvement mis en cache par ses serveurs pour le rendu de la page d'aperçu. Par conséquent, il existe un certain risque pour la confidentialité. Si cela vous préoccupe, il est recommandé de ne pas utiliser la fonction d'aperçu fournie par ce plugin[^1].
- Le fichier à prévisualiser doit être accessible via une URL publique. En temps normal, les fichiers téléchargés dans NocoBase génèrent automatiquement des liens publics accessibles (y compris les URL signées générées par le plugin S3-Pro), mais si le fichier possède des autorisations d'accès restreintes ou est stocké dans un environnement de réseau interne, il ne pourra pas être prévisualisé[^2].
- Ce service ne prend pas en charge l'authentification par connexion ou les ressources stockées de manière privée. Par exemple, les fichiers accessibles uniquement sur un réseau interne ou nécessitant une connexion ne peuvent pas utiliser cette fonction d'aperçu.
- Une fois le contenu du fichier récupéré par le service Microsoft, il peut être mis en cache pendant une courte période. Même si le fichier source est supprimé, le contenu de l'aperçu peut rester accessible pendant un certain temps.
- Des limites de taille de fichier sont recommandées : il est conseillé de ne pas dépasser 10 Mo pour les fichiers Word et PowerPoint, et 5 Mo pour les fichiers Excel, afin de garantir la stabilité de l'aperçu[^3].
- Il n'existe actuellement aucune déclaration officielle claire sur la licence d'utilisation commerciale de ce service. Veuillez évaluer les risques par vous-même lors de son utilisation[^4].

## Formats de fichiers pris en charge

Le plugin prend en charge uniquement l'aperçu des formats de fichiers Office suivants, basés sur le type MIME ou l'extension du fichier :

- Documents Word :
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) ou `application/msword` (`.doc`)
- Feuilles de calcul Excel :
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) ou `application/vnd.ms-excel` (`.xls`)
- Présentations PowerPoint :
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) ou `application/vnd.ms-powerpoint` (`.ppt`)
- Texte OpenDocument : `application/vnd.oasis.opendocument.text` (`.odt`)

Les autres formats de fichiers n'activeront pas la fonction d'aperçu de ce plugin.

[^1]: [Quel est le statut de view.officeapps.live.com ?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Accès refusé ou fichiers non publics ne pouvant pas être prévisualisés](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - Limites de taille de fichier pour Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Utilisation commerciale d'Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)