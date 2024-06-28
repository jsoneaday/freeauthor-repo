import Image from "next/image";

interface ImageElementProps {
  id: bigint;
}

export default function WorkImage({ id }: ImageElementProps) {
  return (
    <Image
      src={`/api/work/image/${id}/main`}
      className="w-full h-52 rounded-xl object-cover"
      width={100}
      height={100}
      alt={""}
    />
  );
}
