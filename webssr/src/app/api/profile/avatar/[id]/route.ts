export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log("id", params.id);
  const response = await fetch(
    `${process.env.EXTERNAL_API_URL}/profile/avatar/${params.id}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to get most popular authors list");
  }

  return new Response(await response.arrayBuffer(), {
    headers: response.headers,
  });
}
