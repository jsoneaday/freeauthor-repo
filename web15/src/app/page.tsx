import WorkCards from "@/components/work/work-card";
import { getMostPopularWorks } from "@/server-actions/work/work";

enum ValidationStates {
  SearchTxtTooShort = "Search string must be at least 3 characters",
  SearchTxtTooLong = "Search string must be less than 250 characters",
  FieldIsValid = "",
}

export default async function Explore() {
  const works = await getMostPopularWorks();

  return (
    <>
      <div className="mt-16 flex justify-center items-center">
        <h1 className="text-3xl md:text-5xl font-semibold text-center max-w-2xl">
          Artitcles on digital marketing, brand building, and design.
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20 mt-16">
        <WorkCards works={works} />
      </div>
    </>
  );
}
