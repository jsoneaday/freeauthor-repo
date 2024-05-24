import { MouseEvent, useState } from "react";
import { NotificationType } from "./modals/Notification";
import { PrimaryButton } from "./Buttons";
import { ProfileForm } from "./ProfileForm";
import Notification from "./modals/Notification";
import { initOrGetUiApi } from "../ui-api/UiApiInstance";
import { useProfile } from "../zustand/Store";
import { useWallet } from "@solana/wallet-adapter-react";
import { IrysApi } from "../api/IrysApi";

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
  const wallet = useWallet();

  const onClickConnectWallet = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!profile) {
      const api = initOrGetUiApi(new IrysApi(), wallet);
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
      <span className="standard-header">
        Please connect your wallet {/* todo: need supported wallets button */}
      </span>
      <span className="btn-span-align" style={{ marginTop: "1em" }}>
        <div style={{ marginTop: "1.25em", color: "var(--warning-cl)" }}>
          {connectValidationMsg}
        </div>
        <PrimaryButton
          label="Connect"
          style={{ marginTop: "1em" }}
          onClick={onClickConnectWallet}
        />
      </span>
      {showProfileForm ? (
        <div className="profile-form-parent">
          <ProfileForm profileCreatedCallback={toggleNotificationState} />
        </div>
      ) : null}
    </Notification>
  );
}
