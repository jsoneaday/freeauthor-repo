import Image from "next/image";

interface ImageElementProps {
  id: bigint;
}

export default function WorkImage({ id }: ImageElementProps) {
  return (
    <Image
      src={`/api/work/image/${id}/main`}
      alt="Description"
      width={500}
      height={300} // This will be ignored when using width only
      layout="intrinsic"
    />
  );
}
