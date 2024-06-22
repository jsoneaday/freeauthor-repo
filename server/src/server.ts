import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { setWorkRoutes } from "./routes/work/WorkRoutes.js";
import { setWorkImageRoutes } from "./routes/work/WorkImageRoutes.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + Typescript");
});

setWorkRoutes(app);
setWorkImageRoutes(app);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
