import { MouseEvent, useState } from "react";
import { NotificationType } from "./modals/Notification";
import { ProfileForm } from "./ProfileForm";
import Notification from "./modals/Notification";
import { useApi } from "../ui-api/UiApiInstance";
import { useProfile } from "../zustand/Store";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { primaryButton } from "../../theme/solana-overrides";

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
  const { connection } = useConnection();
  const wallet = useWallet();
  const api = useApi(wallet);

  const onClickConnectWallet = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log("profile", profile);
    if (!profile) {
      const ownersProfile = await api.getOwnersProfile();
      if (!ownersProfile) {
        setShowProfileForm(true);
        setNotificationHeight(LARGE_NOTIFICATION_HEIGHT);
        setConnectValidationMsg(
          "You must create a profile before you can create content"
        );
      } else {
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
    }
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
            <span>
              <WalletDisconnectButton style={primaryButton} />
            </span>
          ) : (
            <span>
              <WalletMultiButton style={primaryButton} />
            </span>
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
