"use server";

import { friendlyDate } from "@/lib/utils/DateTimeUtils";
import { PAGE_SIZE } from "@/lib/utils/StandardValues";
import { Work } from "@/repo/work/work";

export async function getMostPopularWorks(
  topicId?: string,
  cursor?: string,
  pageSize: number = PAGE_SIZE
) {
  const response = await fetch(`${process.env.EXTERNAL_API_URL}/work/popular`, {
    method: "POST",
    body: JSON.stringify({
      topicId,
      pageSize,
      cursor,
    }),
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to get most popular works list");
  }

  return convertToWork(await response.json());
}

export async function getLatestWorksByAuthor(
  authorId: bigint,
  cursor?: bigint
) {
  const response = await fetch(
    `${process.env.EXTERNAL_API_URL}/work/latest/${authorId}${
      cursor ? "/" + cursor : ""
    }`
  );

  if (!response.ok) {
    throw new Error("Failed to get latest works list");
  }

  const json = await response.json();
  return convertToWork(json);
}

function convertToWork(json: any): Work[] {
  return json.map(
    (item: any) =>
      new Work(
        item.id,
        friendlyDate(item.updatedAt),
        item.title,
        item.description,
        item.content,
        item.authorId,
        item.userName,
        item.fullName,
        item.authorDesc,
        item.workTopics,
        item.workLikes
      )
  );
}
