import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { val } from "./vars.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + Typescript" + val);
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
