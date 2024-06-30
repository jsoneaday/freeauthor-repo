import { getAllTopics } from "@/server-actions/topic/topic";
import TopicElement from "./topic-element";
import { Suspense } from "react";

export async function TopicList() {
  const topics = await getAllTopics();

  return (
    <Suspense fallback={<div>Loading Topics ...</div>}>
      {topics.map((t) => (
        <TopicElement
          key={t.id}
          topicId={t.id}
          name={t.name}
          isSelected={false}
        />
      ))}
    </Suspense>
  );
}
