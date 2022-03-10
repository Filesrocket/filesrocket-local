# filesrocket-local
[Filesrocket](https://github.com/IvanZM123/filesrocket) service to manage your files and directories on your own server.

## Install

```
npm i filesrocket-local
```

## Usage

To use the service add the following content.

```ts
import { Filesrocket } from "filesrocket";
import { LocalService } from "filesrocket-local";

// Initialize filesrocket
const filesrocket = new Filesrocket();

// Setting service
const local = new LocalFileService({
  pagination: { default: 15, max: 50 },
  host: "http://localhost:3030",
  directory: "uploads"
});

// Register services
filesrocket.register("localFile", local.file)

filesrocket.register("localDirectory", local.directory)

// Recovering service
const fileService = filesrocket.service("localFile")

const directoryService = filesrocket.service("localDirectory")

// Recovering controller
const fileController = filesrocket.controller("localFile")

const directoryController = filesrocket.controller("localDirectory")
```
