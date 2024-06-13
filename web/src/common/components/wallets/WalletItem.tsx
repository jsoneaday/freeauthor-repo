import Solflare from "@solflare-wallet/sdk";

type WalletItemProps = {
  onClickWallet: () => Promise<void>;
};

export function WalletItem({ onClickWallet }: WalletItemProps) {
  const onClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    await onClickWallet();
  };

  return (
    <div className="wallet-item" onClick={onClick}>
      Solflare
    </div>
  );
}
