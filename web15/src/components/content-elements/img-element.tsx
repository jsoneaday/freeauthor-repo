import Image from "next/image";

interface ImageElementProps {
  id: bigint;
}

export default function WorkImage({ id }: ImageElementProps) {
  return (
    <Image
      src={`/api/work/image/${id}/main`}
      className="rounded-xl"
      alt="Description"
      width={300}
      height={300}
    />
  );
}
