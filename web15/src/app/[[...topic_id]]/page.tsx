import { TopicList } from "@/components/topic/topic-list";
import WorkCards from "@/components/work/work-card";
import { getMostPopularWorks } from "@/server-actions/work/work";

enum ValidationStates {
  SearchTxtTooShort = "Search string must be at least 3 characters",
  SearchTxtTooLong = "Search string must be less than 250 characters",
  FieldIsValid = "",
}

export type ExploreParams = {
  params: { topic_id: string | undefined };
};

export default async function Explore({ params }: ExploreParams) {
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
