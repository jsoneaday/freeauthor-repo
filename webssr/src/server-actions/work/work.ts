"use server";

import { Work } from "@/repo/work/work";

export async function getMostPopularWorks() {
  const response = await fetch(`${process.env.EXTERNAL_API_URL}/work/popular`, {
    cache: "no-store",
  });

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
    }`,
    {
      cache: "no-store",
    }
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
