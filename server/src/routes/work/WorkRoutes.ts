import { Express } from "express";
import { lstatSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

const filesDir = "./src/__test__/images";

export function setWorkRoutes(app: Express) {
  app.get("/work/:id", (req, res) => {
    const filePaths = readdirSync(filesDir);
    const files: Buffer[] = [];
    for (const fileName of filePaths) {
      const filePath = join(filesDir, fileName);
      if (lstatSync(filePath).isFile()) {
        const file = readFileSync(filePath);
        files.push(file);
      }
    }
    res.contentType("image/jpeg");
    res.send(files[0]);
  });
}
