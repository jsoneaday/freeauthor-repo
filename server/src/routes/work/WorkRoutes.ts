import { Express } from "express";
import { lstatSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { repo } from "../SharedData.js";
import { serializeBigInt } from "../../repository/lib/JsonUtils.js";
import { PAGE_SIZE } from "../../repository/lib/utils.js";

const filesDir = "./src/__test__/images";

export function setWorkRoutes(app: Express) {
  app.get("/work/:id", async (req, res) => {
    try {
      res
        .status(200)
        .json(
          serializeBigInt(await repo.Work.selectWork(BigInt(req.params.id)))
        );
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .json({ error: "Internal server error, failed to get work" });
    }
  });

  app.get("/work/popular/:page_size/:cursor?", async (req, res) => {
    try {
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

      res.status(200).json(serializeBigInt(works));
    } catch (e) {
      res
        .status(500)
        .json({ error: "Internval server error, get popular works failed" });
    }
  });
}
