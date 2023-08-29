{
  "setupTasks": [
    {
      "name": "Install Dependencies",
      "command": "yarn install"
    }
  ],
  "tasks": {
    "dev": {
      "name": "dev",
      "command": "yarn dev",
      "runAtStart": true,
      "preview": {
        "port": 5173
      }
    },
    "build": {
      "name": "build",
      "command": "yarn build",
      "runAtStart": false
    },
    "preview": {
      "name": "preview",
      "command": "yarn preview",
      "runAtStart": false
    }
  }
}
