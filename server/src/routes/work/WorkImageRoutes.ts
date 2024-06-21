import { Express } from "express";
import { repo } from "../SharedData.js";

export function setWorkImageRoutes(app: Express) {
  app.get("/workimg/:workId", async (req, res) => {
    const workId = req.params.workId;

    const images = await repo.WorkImage.selectWorkImages(BigInt(workId));

    res.contentType("image/jpeg");
    res.send(images[0].image);
  });
}
