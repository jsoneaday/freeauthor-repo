"use server";

import { Profile } from "@/repo/profile/profile";

export async function getMostPopularAuthors() {
  const response = await fetch(
    `${process.env.EXTERNAL_API_URL}/profile/popular`,
    {
      method: "POST",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get most popular authors list");
  }

  return (await response.json()) as Profile[];
}
