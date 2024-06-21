import Image from "next/image";

interface ImageElementProps {
  id: bigint;
}

export default function ImageElement({ id }: ImageElementProps) {
  return (
    <Image
      src={`http://localhost:4001/workimg/3`}
      className="w-full h-52 rounded-xl object-cover"
      width={100}
      height={100}
      alt={""}
    />
  );
}
