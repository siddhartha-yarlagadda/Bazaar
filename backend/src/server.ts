import { createServer } from "node:http";
import { createRequestHandler } from "./http/router.js";
import { StoreService } from "./services/store.service.js";

const port = Number(process.env.PORT ?? 3000);
const store = new StoreService();
const server = createServer(createRequestHandler(store));

server.listen(port, () => {
  console.log(`Bazaar API listening on http://localhost:${port}`);
});
