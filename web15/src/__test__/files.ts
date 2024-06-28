import { readFileSync, readdirSync, lstatSync } from "node:fs";
import { join, dirname } from "node:path";

const fileDir = "./src/theme/assets/work-images";
const filesInDir = readdirSync(fileDir);
const testImgFiles: Buffer[] = [];

export function getTestImgFiles() {
  if (testImgFiles.length > 0) {
    return testImgFiles;
  }

  for (const file of filesInDir) {
    const filePath = join(fileDir, file);
    if (lstatSync(filePath).isFile()) {
      const buffer = readFileSync(filePath);
      testImgFiles.push(buffer);
    }
  }

  return testImgFiles;
}
