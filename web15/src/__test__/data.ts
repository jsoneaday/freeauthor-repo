import { Work } from "@/repo/work/work";
import { formattedDate } from "@/lib/utils/DateTimeUtils";
import { faker } from "@faker-js/faker";
import { getTestImgFiles } from "./files";

const testImages = getTestImgFiles();

export const testWorkData: Work[] = [
  new Work(
    BigInt(faker.number.bigInt()),
    formattedDate(faker.date.anytime()),
    faker.lorem.sentences(1),
    faker.lorem.sentences(2),
    faker.lorem.sentences(4),
    BigInt(faker.number.bigInt()),
    faker.internet.userName(),
    faker.internet.displayName(),
    [
      {
        id: faker.number.bigInt(),
        updatedAt: formattedDate(faker.date.anytime()),
        name: "Tech",
      },
    ],
    testImages[0]
  ),
  new Work(
    BigInt(faker.number.bigInt()),
    formattedDate(faker.date.anytime()),
    faker.lorem.sentences(1),
    faker.lorem.sentences(2),
    faker.lorem.sentences(4),
    BigInt(faker.number.bigInt()),
    faker.internet.userName(),
    faker.internet.displayName(),
    [
      {
        id: faker.number.bigInt(),
        updatedAt: formattedDate(faker.date.anytime()),
        name: "Tech",
      },
    ],
    testImages[1]
  ),
  new Work(
    BigInt(faker.number.bigInt()),
    formattedDate(faker.date.anytime()),
    faker.lorem.sentences(1),
    faker.lorem.sentences(2),
    faker.lorem.sentences(4),
    BigInt(faker.number.bigInt()),
    faker.internet.userName(),
    faker.internet.displayName(),
    [
      {
        id: faker.number.bigInt(),
        updatedAt: formattedDate(faker.date.anytime()),
        name: "Tech",
      },
    ],
    testImages[2]
  ),
  new Work(
    BigInt(faker.number.bigInt()),
    formattedDate(faker.date.anytime()),
    faker.lorem.sentences(1),
    faker.lorem.sentences(2),
    faker.lorem.sentences(4),
    BigInt(faker.number.bigInt()),
    faker.internet.userName(),
    faker.internet.displayName(),
    [
      {
        id: faker.number.bigInt(),
        updatedAt: formattedDate(faker.date.anytime()),
        name: "Tech",
      },
    ],
    testImages[3]
  ),
];
