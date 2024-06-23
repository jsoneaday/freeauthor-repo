import { testWorkData } from "@/__test__/data";
import WorkElements from "@/components/content-elements/work-element";

export default function Read() {
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
