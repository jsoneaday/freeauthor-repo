export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string; placeholder: string } }
) {
  const response = await fetch(
    `${process.env.EXTERNAL_API_URL}/work_image/${params.id}/${params.placeholder}`,
    { cache: "no-store" }
  );

  if (!response.ok) throw new Error("Failed to get back work image file");

  const buffer = Buffer.from(await response.arrayBuffer());
  return new Response(buffer, { headers: response.headers });
}
