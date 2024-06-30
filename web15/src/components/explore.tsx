import { getMostPopularWorks } from "@/server-actions/work/work";
import { TopicList } from "./topic/topic-list";
import WorkCards from "./work/work-card";

export type ExploreParams = {
  params: { topic_id: string | undefined };
};

export async function ExploreComponent({ params }: ExploreParams) {
  const works = await getMostPopularWorks();

  console.log("topic_id", params?.topic_id);

  return (
    <>
      <div className="mt-4 flex justify-center items-center flex-wrap w-3/4 m-auto">
        <TopicList />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20 mt-16">
        <WorkCards works={works} />
      </div>
    </>
  );
}
