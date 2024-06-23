import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { setWorkRoutes } from "./routes/work/WorkRoutes.js";
import { setWorkImageRoutes } from "./routes/work/WorkImageRoutes.js";
import { setProfileRoutes } from "./routes/profile/ProfileRoutes.js";
import { setProfileAvatarRoutes } from "./routes/profile/ProfileAvatarRoutes.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

setWorkRoutes(app);
setWorkImageRoutes(app);
setProfileRoutes(app);
setProfileAvatarRoutes(app);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
