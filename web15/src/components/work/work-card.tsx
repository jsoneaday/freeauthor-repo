import { Work } from "@/repo/work/work";
import Link from "next/link";
import WorkImage from "../content-elements/img-element";

interface WorkElementsProps {
  works: Work[];
}

export default function WorkCards({ works }: WorkElementsProps) {
  return works.map((work) => <WorkCard key={work.id} work={work} />);
}

interface WorkElementProps {
  work: Work;
}

function WorkCard({ work }: WorkElementProps) {
  return (
    <article className="card lg:card-side ring-1 ring-base-content/10 bg-base-300/20 p-7 rounded-3xl">
      <Link href={`/read/${work.slug}`}>
        <div style={{ width: "300px", height: "auto" }}>
          <WorkImage id={work.id} />
        </div>
      </Link>

      <div className="card-body p-0 lg:ml-7">
        <h2 className="text-xs lg:text-sm text-base-content/70">
          <span>
            {work.topics && work.topics.length > 0 ? work.topics[0].name : ""}
          </span>
          <span className="text-xl font-bold text-primary">.</span>
          <time className="text-xs lg:text-sm text-base-content/70">
            {work.updatedAt}
          </time>
        </h2>
        <Link href={`/read/${work.slug}`}>
          <h1 className="font-semibold text-lg lg:text-xl">{work.title}</h1>
        </Link>

        <div>
          <p className="text-sm lg:text-base opacity-70 line-clamp-2 xl:line-clamp-3">
            {work.description}
          </p>
        </div>

        <Link
          href={`/read/${work.slug}`}
          className=" text-primary/70 hover:underline mt-auto flex items-center"
        >
          <h2 className="text-sm font-semibold">Read article</h2>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="ml-1 h-4 w-4 stroke-current"
          >
            <path
              d="M6.75 5.75 9.25 8l-2.5 2.25"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </article>
  );
}
