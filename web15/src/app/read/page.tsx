import AuthorIntro from "@/components/profile/author-intro";
import LatestWorks from "@/components/work/latest-works";
import { getMostPopularAuthors } from "@/server-actions/profile/profile";

export default async function Read() {
  const popAuthors = await getMostPopularAuthors();
  const popAuthor =
    popAuthors[Math.floor(Math.random() * (popAuthors.length - 1))];

  return (
    <div className="w-full">
      <AuthorIntro author={popAuthor} />
      <div className="divider p-0"></div>
      <LatestWorks authorId={popAuthor.id} />
    </div>
  );
}
