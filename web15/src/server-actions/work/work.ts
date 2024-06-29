"use server";

import { PAGE_SIZE } from "@/lib/utils/StandardValues";
import { Work } from "@/repo/work/work";

export async function getMostPopularWorks(
  cursor?: bigint,
  pageSize: number = PAGE_SIZE
) {
  const _cursor = cursor ? `/${cursor}` : "";
  const response = await fetch(
    `${process.env.EXTERNAL_API_URL}/work/popular/${pageSize}${_cursor}`
  );
  console.log("response", response);
  if (!response.ok) {
    throw new Error("Failed to get most popular works list");
  }

  return (await response.json()) as Work[];
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
        item.updatedAt,
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
