import { getLatestWorksByAuthor } from "@/server-actions/work/work";
import WorkCards from "./work-card";

export default async function LatestWorks({ authorId }: { authorId: bigint }) {
  const latestWorks = await getLatestWorksByAuthor(authorId);

  return (
    <div>
      <div className="py-10 max-w-lg">
        <h1 className="text-4xl md:text-5xl font-semibold brightness-150">
          Recent Articles
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <WorkCards works={latestWorks} />
      </div>
    </div>
  );
}
