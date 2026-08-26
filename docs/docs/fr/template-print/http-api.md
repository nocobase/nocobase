---
title: "API HTTP de l'impression par modèle"
description: "API HTTP de l'impression par modèle NocoBase : utilisez l'action templatePrint pour imprimer des enregistrements sélectionnés, le résultat du filtrage courant ou toutes les données correspondantes, et téléchargez les fichiers Word, Excel, PowerPoint ou PDF générés."
keywords: "impression par modèle,API HTTP,templatePrint,PDF,impression d'enregistrements sélectionnés,impression de tout,NocoBase"
---

# API HTTP

L'impression par modèle prend en charge le déclenchement direct du rendu et du téléchargement de documents via l'API HTTP. Que ce soit pour un bloc Détails ou un bloc Tableau, il s'agit essentiellement de déclencher l'action `templatePrint` sur la ressource métier courante.

```shell
curl -X POST \
	-H "Authorization: Bearer <JWT>" \
	-H "Content-Type: application/json" \
	"http://localhost:3000/api/<resource_name>:templatePrint" \
	--data-raw '{...}'
```

Notes :
- `<resource_name>` est le nom de la ressource correspondant à la collection courante.
- L'interface renvoie un flux de fichier binaire, et non des données JSON.
- L'appelant doit disposer des permissions de requête sur la ressource courante, ainsi que des permissions d'utilisation du bouton d'impression par modèle correspondant.
- L'appel d'interface nécessite la transmission d'un jeton JWT basé sur la connexion utilisateur via l'en-tête de requête Authorization, sans quoi l'accès sera refusé.

## Paramètres du corps de requête

| Paramètre | Type | Obligatoire | Description |
| --- | --- | --- | --- |
| `templateName` | `string` | Oui | Nom du modèle, correspondant à l'identifiant du modèle configuré dans la gestion des modèles. |
| `blockName` | `string` | Oui | Type de bloc. Pour un bloc Tableau, passez `table` ; pour un bloc Détails, passez `details`. |
| `timezone` | `string` | Non | Fuseau horaire, par exemple `Asia/Shanghai`. Utilisé pour le rendu des dates et heures dans le modèle. |
| `uid` | `string` | Non | Le schema uid du bouton d'impression par modèle, utilisé pour la vérification des permissions. |
| `convertedToPDF` | `boolean` | Non | S'il faut convertir en PDF. Lorsque `true`, renvoie un fichier `.pdf`. |
| `queryParams` | `object` | Non | Paramètres transmis à la requête de données sous-jacente. |
| `queryParams.page` | `number \| null` | Non | Numéro de page de pagination. La valeur `null` signifie sans pagination. |
| `queryParams.pageSize` | `number \| null` | Non | Nombre d'éléments par page. La valeur `null` signifie sans pagination. |
| `queryParams.filter` | `object` | Non | Conditions de filtrage, fusionnées automatiquement avec les conditions de filtrage fixes de l'ACL. |
| `queryParams.appends` | `string[]` | Non | Champs associés à inclure dans la requête. |
| `queryParams.filterByTk` | `string \| object` | Non | Couramment utilisé pour le bloc Détails, pour spécifier la valeur de la clé primaire. |
| `queryParams.sort` et autres paramètres | `any` | Non | Les autres paramètres de requête sont transmis tels quels à la requête de la ressource sous-jacente. |

## Bloc Tableau

Le bloc Tableau utilise la même interface, et spécifie le mode d'impression de liste via `blockName: "table"`. Le serveur exécute une requête `find` sur la ressource et transmet le tableau de résultats au modèle.

### Imprimer les enregistrements sélectionnés ou le résultat de la page courante

Adapté pour cocher certains enregistrements dans un bloc Tableau pour les imprimer, ou pour conserver le contexte de pagination courant pour l'impression. La pratique courante consiste à :

- Définir `queryParams.page` et `queryParams.pageSize` sur le numéro de page et la taille de page courants du tableau.
- Composer les clés primaires des enregistrements cochés en condition `filter.id.$in`.

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": 20,
			"filter": {
				"id": {
					"$in": [1, 2]
				}
			},
			"appends": [],
			"page": 1
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Shanghai",
		"uid": "ixs3fx3x6is"
	}'
```

Signification de ce type de requête :

- `blockName` est `table`, ce qui signifie que le modèle est rendu à partir des données de liste.
- `filter.id.$in` est utilisé pour spécifier l'ensemble des enregistrements à imprimer.
- `page` et `pageSize` conservent le contexte de pagination courant, pour rester cohérent avec le comportement de l'interface.
- `appends` permet d'ajouter au besoin des champs associés.

### Imprimer toutes les données correspondantes

Adapté à l'appel effectué lors du clic sur «Imprimer tous les enregistrements» dans un bloc Tableau. Dans ce cas, la pagination courante n'est plus appliquée, et toutes les données correspondant aux conditions de filtrage courantes sont récupérées directement.

Le point clé est de passer explicitement `queryParams.page` et `queryParams.pageSize` à `null`.

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": null,
			"filter": {},
			"appends": [],
			"page": null
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Shanghai",
		"uid": "ixs3fx3x6is"
	}'
```

Signification de ce type de requête :

- `page: null` et `pageSize: null` indiquent l'annulation de la limite de pagination.
- `filter: {}` indique qu'aucune condition de filtrage supplémentaire n'est appliquée ; si l'interface a déjà des conditions de filtrage, vous pouvez aussi les placer ici directement.
- Le serveur récupère toutes les données correspondantes et rend le modèle par lots.

> Note : un bloc Tableau peut imprimer au maximum 300 enregistrements à la fois. Au-delà de cette limite, l'interface renvoie une erreur `400`.

## Bloc Détails

Le bloc Détails utilise également l'action `templatePrint`, mais on lui passe généralement :

- `blockName: "details"`
- `queryParams.filterByTk` pour spécifier la clé primaire de l'enregistrement courant
- `queryParams.appends` pour spécifier les champs associés à inclure dans la requête

Le serveur exécute une requête `findOne` sur la ressource et transmet l'objet résultat au modèle.

## Résultat de retour

Lorsque l'appel réussit, l'interface renvoie directement un flux de fichier. Les en-têtes de réponse typiques sont les suivants :

```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="<template-title>-<suffix>.<ext>"
```

Notes :

- Lorsque `convertedToPDF` est `true`, l'extension du fichier renvoyé est `.pdf`.
- Sinon, le fichier renvoyé correspond au type d'origine du modèle, par exemple `.docx`, `.xlsx` ou `.pptx`.
- Le frontend déclenche généralement le téléchargement par le navigateur en se basant sur le nom de fichier dans `Content-Disposition`.

## Autres ressources
- [Utiliser les clés API dans NocoBase](../integration/api-keys/usage.md)
