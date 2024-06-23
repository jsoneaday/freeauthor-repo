import { Express } from "express";
import { repo } from "../SharedData.js";
import { serializeBigInt } from "../../repository/lib/JsonUtils.js";

export function setProfileAvatarRoutes(app: Express) {
  app.get("/profile/avatar/:id", async (req, res) => {
    try {
      const file = await repo.ProfileAvatar.selectProfileAvatar(
        BigInt(req.params.id)
      );

      res.status(200).contentType("image/jpeg").send(file?.avatar);
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .json({ error: "Internal server error, failed to get avatar" });
    }
  });
}
