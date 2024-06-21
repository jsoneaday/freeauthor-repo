import { testWorkData } from "@/__test__/data";
import { Work } from "@/api/work/work";
import WorkElements from "@/components/content-elements/work-element";
import TopicElement from "@/components/topic-element";
import { formattedDate } from "@/lib/utils/DateTimeUtils";
import { faker } from "@faker-js/faker";

enum ValidationStates {
  SearchTxtTooShort = "Search string must be at least 3 characters",
  SearchTxtTooLong = "Search string must be less than 250 characters",
  FieldIsValid = "",
}

export default function Explore() {
  return (
    <>
      <div className="mt-16 flex justify-center items-center">
        <h1 className="text-3xl md:text-5xl font-semibold text-center max-w-2xl">
          Artitcles on digital marketing, brand building, and design.
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20 mt-16">
        <WorkElements works={testWorkData} />
      </div>
    </>
  );
}
