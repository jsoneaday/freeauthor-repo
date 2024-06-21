import { getTestImgFiles } from "@/__test__/files";
import { NextApiResponse } from "next";

export async function GET(request: Request, response: NextApiResponse) {
  const files: Buffer[] = getTestImgFiles();
  response.setHeader("Content-Type", "image/jpeg");
  response.send(files[0]);
}
