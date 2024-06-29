import { Express } from "express";
import { lstatSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { repo } from "../SharedData.js";
import { serializeBigInt } from "../../repository/lib/JsonUtils.js";
import { PAGE_SIZE } from "../../repository/lib/utils.js";

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

  app.get("/work/popular/:page_size/:cursor?", async (req, res) => {
    try {
      console.log("cursor", req.params.cursor);
      const cursor = req.params.cursor ? BigInt(req.params.cursor) : undefined;

      res
        .status(200)
        .json(
          serializeBigInt(
            await repo.Work.selectMostPopularWorks(
              req.params.page_size ? Number(req.params.page_size) : undefined
            )
          )
        );
    } catch (e) {
      console.log("e", e);
      res
        .status(500)
        .json({ error: "Internval server error, get popular works failed" });
    }
  });

  app.get("/work/latest/:authorId/:cursor?", async (req, res) => {
    try {
      const works = await repo.Work.selectLatestWorksByAuthor(
        BigInt(req.params.authorId),
        PAGE_SIZE,
        req.params.cursor ? BigInt(req.params.cursor) : undefined
      );
      console.log("works", works);
      res.status(200).json(serializeBigInt(works));
    } catch (e) {
      res
        .status(500)
        .json({ error: "Internval server error, get popular works failed" });
    }
  });
}
