import { Adapter } from "@solana/wallet-adapter-base";
import { Wallet } from "@solana/wallet-adapter-react";

type WalletItemProps = {
  wallet: Wallet;
  onClickWallet: (walletAdapter: Adapter) => Promise<void>;
};

export function WalletItem({ wallet, onClickWallet }: WalletItemProps) {
  const onClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (wallet.readyState === "Installed") {
      await onClickWallet(wallet.adapter);
    }
  };

  return (
    <div className="wallet-item" onClick={onClick}>
      <img
        src={wallet.adapter.icon}
        style={{ width: "1.5em", marginRight: "1em" }}
      />
      {wallet.adapter.name}
    </div>
  );
}
