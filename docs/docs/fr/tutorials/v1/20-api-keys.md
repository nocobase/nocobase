# Récupérer des données avec des API Keys

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114233060688108&bvid=BV1m8ZuY4E2V&cid=29092153179&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Bienvenue dans ce tutoriel.
Dans ce document, je vais vous guider pas à pas dans l'utilisation des clés API dans NocoBase pour récupérer des données. Nous prenons l'exemple d'une « to-do list » pour vous aider à comprendre chaque étape. Lisez attentivement la suite et suivez les étapes.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Comprendre la notion de clé API

Avant de commencer, il faut bien comprendre : qu'est-ce qu'une clé API ? C'est un peu comme un ticket d'entrée qui permet de vérifier que la requête API provient d'un utilisateur légitime. Lorsque vous accédez à NocoBase depuis une page web, une application mobile ou un script en arrière-plan, cette « clé secrète » permet au système de vérifier rapidement votre identité.

Dans l'en-tête HTTP, on trouve ce format :

```txt
Authorization: Bearer {API key}
```

Le préfixe « Bearer » indique que ce qui suit est une clé API validée, ce qui permet de confirmer rapidement les permissions de l'appelant.

En pratique, les clés API sont utilisées dans les scénarios suivants :

1. **Accès depuis une application cliente** : lorsqu'un utilisateur appelle l'API depuis un navigateur ou une application mobile, le système vérifie son identité grâce à la clé API, pour s'assurer que seuls les utilisateurs autorisés peuvent accéder aux données.
2. **Tâches automatisées** : les tâches planifiées ou les scripts exécutés en arrière-plan utilisent une clé API pour garantir la sécurité et la légitimité de leurs requêtes lorsqu'ils mettent à jour des données ou écrivent des journaux.
3. **Développement et tests** : pendant le débogage et les tests, les développeurs utilisent une clé API pour simuler des requêtes réelles et s'assurer que les API répondent correctement.

En résumé, la clé API permet non seulement de confirmer l'identité de l'appelant, mais aussi de surveiller les appels, de limiter le débit et de prévenir les menaces de sécurité, pour garantir le bon fonctionnement de NocoBase.

## 2 Créer une clé API dans NocoBase

### 2.1 Activer le plugin [API Keys](https://docs-cn.nocobase.com/handbook/api-keys)

Vérifiez d'abord que le plugin natif « Authentification : API Keys » est activé. Une fois activé, le centre de paramètres système propose une nouvelle page de configuration [API Keys](https://docs-cn.nocobase.com/handbook/api-keys).

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Créer une table pour les tâches de test

Pour faciliter les tests, créons à l'avance une table appelée `todos`, avec les champs :

- `id`
- `title`
- `completed`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Saisissez ensuite quelques tâches dans cette table, par exemple :

- Manger
- Dormir
- Jouer

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Créer et associer un rôle

Comme la clé API est liée au rôle de l'utilisateur, le système se base sur le rôle pour déterminer les permissions associées à la requête. Avant de créer une clé API, nous devons donc créer un rôle et lui attribuer les permissions nécessaires.
Nous suggérons de créer un rôle de test « Rôle API To-do » et de lui attribuer toutes les permissions sur la table des tâches.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Si lors de la création de la clé API, vous ne pouvez pas sélectionner « Rôle API système To-do », c'est probablement parce que l'utilisateur courant n'a pas encore ce rôle. Attribuez-lui d'abord ce rôle :

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Après attribution, rafraîchissez la page, allez dans la gestion des clés API, cliquez sur « Ajouter une clé API » et vous verrez le « Rôle API système To-do » apparaître.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Pour une gestion plus précise, vous pouvez également créer un utilisateur dédié « Utilisateur API To-do » qui se connecte au système, teste les permissions et gère les clés API. Il suffit de lui attribuer uniquement le « Rôle API To-do ».
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Créer la clé API et la sauvegarder

Après soumission, le système affiche un message de confirmation et fait apparaître la clé API dans une fenêtre. Pensez impérativement à copier et sauvegarder cette clé : pour des raisons de sécurité, le système ne l'affichera plus à l'avenir.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Vous obtiendrez par exemple une clé API du type :

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Points importants

- La durée de validité de la clé API dépend de la durée que vous avez choisie au moment de la demande.
- La logique de génération et de vérification des clés API est étroitement liée à la variable d'environnement `APP_KEY` ; ne la modifiez pas à la légère, sinon toutes les clés API du système deviendront invalides.

## 3 Tester la validité de la clé API

### 3.1 Utiliser le plugin [API Documentation](https://docs-cn.nocobase.com/handbook/api-doc)

Ouvrez le plugin API Documentation : vous y voyez la méthode HTTP, l'URL, les paramètres et les en-têtes de chaque API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Comprendre les API CRUD de base

Voici quelques exemples d'API fournies par NocoBase :

- **Liste (interface list) :**

  ```txt
  GET {baseURL}/{collectionName}:list
  Headers :
  - Authorization: Bearer <API key>

  ```
- **Création (interface create) :**

  ```txt
  POST {baseURL}/{collectionName}:create

  Headers :
  - Authorization: Bearer <API key>

  Body (JSON), par exemple :
      {
          "title": "123"
      }
  ```
- **Mise à jour (interface update) :**

  ```txt
  POST {baseURL}/{collectionName}:update?filterByTk={id}
  Headers :
  - Authorization: Bearer <API key>

  Body (JSON), par exemple :
      {
          "title": "123",
          "completed": true
      }
  ```
- **Suppression (interface delete) :**

  ```txt
  POST {baseURL}/{collectionName}:destroy?filterByTk={id}
  Headers :
  - Authorization: Bearer <API key>
  ```

`{baseURL}` est l'adresse de votre instance NocoBase et `{collectionName}` est le nom de la table. Par exemple, en local, l'adresse est `localhost:13000` et le nom de la table est `todos` ; l'URL de la requête est :

```txt
http://localhost:13000/todos:list
```

### 3.3 Tester avec Postman (exemple : interface List)

Ouvrez Postman, créez une nouvelle requête GET avec l'URL ci-dessus, et ajoutez un en-tête `Authorization` avec votre clé API en valeur :

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)
Si tout va bien, la requête renvoie une réponse semblable à :

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

Si la clé API n'est pas correctement autorisée, vous obtiendrez une erreur du type :

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

Dans ce cas, vérifiez les permissions du rôle, l'association de la clé API et le format de la clé.

### 3.4 Copier le code de requête depuis Postman

Une fois le test réussi, vous pouvez copier le code de la requête List. Par exemple, l'exemple curl ci-dessous est copié depuis Postman :

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Afficher la to-do list dans un [bloc iframe](https://docs-cn.nocobase.com/handbook/block-iframe)

Pour mieux visualiser l'effet de la requête API, on peut utiliser une page HTML simple qui affiche la liste des tâches récupérées depuis NocoBase. Voici un exemple :

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List</title>
</head>
<body>
    <h1>Todo List</h1>
    <pre id="result"></pre>

    <script>
        fetch('http://localhost:13000/api/todos:list', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    </script>
</body>
</html>
```

Le code ci-dessus affiche dans le bloc iframe une simple « Todo List » : au chargement de la page, il appelle l'API pour récupérer les tâches et affiche le résultat sous forme de JSON formaté.

L'animation suivante illustre le déroulement de la requête :

![202503031918-fetch](https://static-docs.nocobase.com/202503031918-fetch.gif)

## 5 Conclusion

À travers ces étapes, nous avons détaillé comment créer et utiliser une clé API dans NocoBase. De l'activation du plugin à la création d'une table, en passant par l'association d'un rôle, le test des API et l'affichage des données dans un bloc iframe, chaque étape a son importance. Au final, avec l'aide de DeepSeek, nous avons même réalisé une simple page de to-do list. À vous d'adapter et d'étendre le code selon vos besoins.

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

[Le code de cet exemple](https://forum.nocobase.com/t/api-api-key/3314) est disponible sur le forum communautaire ; n'hésitez pas à le consulter et à en discuter. Nous espérons que ce document vous a fourni des explications claires. Bon apprentissage et bonnes manipulations !
