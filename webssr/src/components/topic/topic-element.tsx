import Link from "next/link";

interface TopicElementProps {
  topicId: string;
  name: string;
  isSelected: boolean;
  resetPagingState: () => void;
}

export default function TopicElement({
  topicId,
  name,
  isSelected,
  resetPagingState,
}: TopicElementProps) {
  let localIsSelected = true;
  const setLocalIsSelected = (isSelected: boolean) => {
    localIsSelected = isSelected;
  };

  if (isSelected) {
    setLocalIsSelected(isSelected);
  }

  const onClickLinkTopic = () => {
    setLocalIsSelected(true);
    resetPagingState();
  };

  return (
    <Link href={`/explorer/${topicId}`} onClick={onClickLinkTopic}>
      {localIsSelected ? (
        <div className="topic-item-selected">
          <div className="topic-item">{name}</div>
        </div>
      ) : (
        <div className="topic-item" style={{ margin: ".75em" }}>
          {name}
        </div>
      )}
    </Link>
  );
}
