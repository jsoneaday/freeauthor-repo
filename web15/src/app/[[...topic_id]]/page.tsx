import { TopicList } from "@/components/topic/topic-list";
import WorkCards from "@/components/work/work-card";
import { Work } from "@/repo/work/work";
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
  let works: Work[] | undefined = undefined;

  if (params?.topic_id) {
    works = await getMostPopularWorks(params.topic_id);
    console.log(
      "works",
      works.map((w) => w.topics![0].id)
    );
  } else {
    works = await getMostPopularWorks();
  }

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
