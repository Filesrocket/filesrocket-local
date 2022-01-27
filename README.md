# filesrocket-local
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
We have created this repository to help as an example guide.

| Framework | Repository |
| --------- | ---------- |
| Express | [filesrocket-express-app](https://github.com/IvanZM123/filesrocket-express-app) |
