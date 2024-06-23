export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const response = await fetch(
    `${process.env.EXTERNAL_API_URL}/workimg/${params.id}`
  );

  if (!response.ok) throw new Error("Failed to get back work image file");

  const buffer = Buffer.from(await response.arrayBuffer());
  return new Response(buffer, { headers: response.headers });
}
