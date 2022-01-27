# Filesrocket-local
[Filesrocket](https://github.com/IvanZM123/filesrocket) service to manage your files and directories on your own server.

## Install
```
npm i filesrocket-local
```

## Usage
To use the service add the following content.
```ts
import {
  LocalFileService,
  LocalDirectoryService,
  LocalOptions
} from "filesrocket-local";

const options: LocalOptions = {
  pagination: { default: 15, max: 50 },
  host: "http://localhost:3030",
  directory: "uploads"
}

app.use(RocketRouter.forRoot({
  path: "storage",
  services: [
    // Manage your files.
    { service: new LocalFileService(options) },
    // Manage your directories.
    { service: new LocalDirectoryService(options) }
  ]
}));
```

For interact with the files and directories enter to the following enpoints.

**Files**: http://localhost:3030/storage/local/files

**Directories**: http://localhost:3030/storage/local/directories

## Examples
We have also created many repositories with the most popular frameworks for you to play around with, to help as example guides.

| Framework | Repository |
| --------- | ---------- |
| Vue | [filesrocket-vue-app](https://github.com/IvanZM123/filesrocket-vue-app) |
| Angular | [filesrocket-angular-app](https://github.com/IvanZM123/filesrocket-angular-app) |
| React | [filesrocket-react-app](https://github.com/IvanZM123/filesrocket-react-app)|
| Express | [filesrocket-express-app](https://github.com/IvanZM123/filesrocket-express-app) |
