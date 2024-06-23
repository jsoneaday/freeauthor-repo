import AuthorIntro from "@/components/profile/author-intro";

enum ValidationStates {
  SearchTxtTooShort = "Search string must be at least 3 characters",
  SearchTxtTooLong = "Search string must be less than 250 characters",
  FieldIsValid = "",
}

export default function Explore() {
  return (
    <div className="w-full">
      <AuthorIntro />;
    </div>
  );
}
