import { ExploreComponent, ExploreParams } from "@/components/explore";
import { TopicList } from "@/components/topic/topic-list";
import WorkCards from "@/components/work/work-card";
import { getMostPopularWorks } from "@/server-actions/work/work";

enum ValidationStates {
  SearchTxtTooShort = "Search string must be at least 3 characters",
  SearchTxtTooLong = "Search string must be less than 250 characters",
  FieldIsValid = "",
}

export default async function Explore({ params }: ExploreParams) {
  return <ExploreComponent params={params} />;
}
