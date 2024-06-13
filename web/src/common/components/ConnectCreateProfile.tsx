import { useState, useTransition } from "react";
import { NotificationType } from "./modals/Notification";
import { ProfileForm } from "./ProfileForm";
import Notification from "./modals/Notification";
import { initOrGetUiApi } from "../ui-api/UiApiInstance";
import { useProfile } from "../zustand/Store";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import { primaryButton } from "../../theme/solana-overrides";
import { WalletItem } from "./wallets/WalletItem";
import { Adapter } from "@solana/wallet-adapter-base";
import { UiApi } from "../ui-api/UiApi";

export const SMALL_NOTIFICATION_HEIGHT = "170px";
export const LARGE_NOTIFICATION_HEIGHT = "580px";

interface ConnectCreateProfileProps {
  notificationState: boolean;
  toggleNotificationState: () => void;
}

export function ConnectCreateProfile({
  notificationState,
  toggleNotificationState,
}: ConnectCreateProfileProps) {
  const profile = useProfile((state) => state.profile);
  const setProfile = useProfile((state) => state.setProfile);
  const [notificationHeight, setNotificationHeight] = useState(
    SMALL_NOTIFICATION_HEIGHT
  );
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [connectValidationMsg, setConnectValidationMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const { connection } = useConnection();
  const wallet = useWallet();
  let api: UiApi | undefined;

  const afterConnect = async (specificWalletAdapter: Adapter) => {
    wallet.select(specificWalletAdapter.name);
    console.log("wallet selected");

    let intervalCount = 5;
    const interval = setInterval(async () => {
      console.log("try interval", specificWalletAdapter.connected);
      console.log("intervalCount", intervalCount);
      if (intervalCount === 0) {
        clearInterval(interval);
      }
      if (specificWalletAdapter.connected) {
        console.log("wallet is connected", wallet);
        api = initOrGetUiApi(wallet);
        if (!profile) {
          console.log(
            "profile not found, trying to see if profile exists on arweave"
          );
          const ownersProfile = await api.getOwnersProfile();
          if (!ownersProfile) {
            console.log("profile does not exist showing create profile screen");
            setShowProfileForm(true);
            setNotificationHeight(LARGE_NOTIFICATION_HEIGHT);
            setConnectValidationMsg(
              "You must create a profile before you can create content"
            );
          } else {
            console.log("profile already exists, set current profile object");
            // if profile already exists just allow writing
            toggleNotificationState();
            setProfile({
              id: ownersProfile?.id,
              updatedAt: ownersProfile.updatedAt,
              username: ownersProfile.userName,
              fullname: ownersProfile.fullName,
              description: ownersProfile.description,
              ownerAddress: ownersProfile.ownerAddress,
              socialLinkPrimary: ownersProfile.socialLinkPrimary || "",
              socialLinkSecond: ownersProfile.socialLinkSecond || "",
            });
            setShowProfileForm(false);
            setNotificationHeight(SMALL_NOTIFICATION_HEIGHT);
            setConnectValidationMsg("");
          }
          intervalCount = 0;
          return;
        }
      }
      intervalCount -= 1;
    }, 2000);
  };

  return (
    <Notification
      title="Notification"
      notiType={NotificationType.Warning}
      isOpen={notificationState}
      toggleIsOpen={toggleNotificationState}
      width="25%"
      height={notificationHeight}
    >
      <div className="push-away">
        <span className="standard-header">
          {wallet.connected ? null : <span>Please connect your wallet</span>}
        </span>
        <span className="btn-span-align" style={{ marginTop: "1em" }}>
          <div style={{ marginTop: "1.25em", color: "var(--warning-cl)" }}>
            {connectValidationMsg}
          </div>
          {wallet.connected ? (
            <WalletDisconnectButton style={primaryButton} />
          ) : (
            wallet.wallets.map((w) => {
              if (w.adapter.name.toLowerCase() === "solflare") {
                return (
                  <WalletItem
                    key={w.adapter.name}
                    wallet={w}
                    onClickWallet={afterConnect}
                  />
                );
              }
              return null;
            })
          )}
        </span>
        {showProfileForm ? (
          <div className="profile-form-parent">
            <ProfileForm profileCreatedCallback={toggleNotificationState} />
          </div>
        ) : null}
      </div>
    </Notification>
  );
}
