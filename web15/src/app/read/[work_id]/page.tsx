import WorkImage from "@/components/content-elements/img-element";
import { Work } from "@/repo/work/work";
import { useParams } from "next/navigation";

export async function Page() {
  const { work_id } = useParams();

  let work: Work | undefined;
  let topic =
    work && work.topics && work.topics.length > 0 ? work.topics[0].name : "";

  return (
    <article className="w-full flex flex-col items-center">
      <header className="max-w-2xl mt-5">
        <div className="badge badge-outline">{topic}</div>
        <h1 className="md:text-4xl text-2xl font-extrabold mb-4">
          {work?.title}
        </h1>
        <section className="flex mb-10">
          <WorkImage id={work?.id || BigInt(0)} />
          <div className="flex flex-col ml-3">
            <h2 className="text-md font-semibold">{work?.fullName}</h2>
            <time className="text-xs opacity-70">{work?.updatedAt}</time>
          </div>
        </section>
      </header>
      <WorkImage id={work?.id || BigInt(0)} />

      <section className="prose md:prose-md mb-20">Test content</section>
    </article>
  );
}
