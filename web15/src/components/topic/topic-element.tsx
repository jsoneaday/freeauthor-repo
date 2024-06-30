"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface TopicElementProps {
  topicId: string;
  name: string;
  isSelected: boolean;
}

export default function TopicElement({
  topicId,
  name,
  isSelected,
}: TopicElementProps) {
  let [localIsSelected, setLocalIsSelected] = useState(isSelected);

  useEffect(() => {
    console.log("isSelected", isSelected);
    setLocalIsSelected(isSelected);
  }, [isSelected]);

  const onClickLinkTopic = () => {
    setLocalIsSelected(true);
  };

  return (
    <Link href={`/${topicId}`} onClick={onClickLinkTopic}>
      {localIsSelected ? (
        <div
          className={`whitespace-nowrap border border-black py px-4 rounded-full m-2`}
        >
          {name}
        </div>
      ) : (
        <div
          className={`whitespace-nowrap border border-gray-400 py px-4 rounded-full m-4`}
        >
          {name}
        </div>
      )}
    </Link>
  );
}
