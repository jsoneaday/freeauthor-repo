import { useEffect, useState, useTransition, MouseEvent } from "react";
import { NotificationType } from "./modals/Notification";
import { ProfileForm } from "./ProfileForm";
import Notification from "./modals/Notification";
import { useProfile } from "../zustand/Store";
import { useWallet } from "../context/SolflareContext";
import { useUiApi } from "../context/UiApiContext";

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
  const [_isPending, startTransition] = useTransition();
  const solflareWallet = useWallet();
  const api = useUiApi();

  useEffect(() => {
    console.log("useEffect api", api);
    handleConnect();
  }, [api]);

  const handleConnect = async () => {
    console.log("handleConnect api", api);
    if (api) {
      startTransition(async () => {
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
      });
    }
  };

  const afterConnect = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    setConnectValidationMsg("Waiting for wallet connection ...");
    console.log("is wallet null", solflareWallet);
    await solflareWallet?.connect();
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
          {solflareWallet?.connected ? null : (
            <span>Please connect your wallet</span>
          )}
        </span>
        <span className="btn-span-align" style={{ marginTop: "1em" }}>
          <div style={{ color: "var(--warning-cl)" }}>
            {connectValidationMsg}
          </div>
          {solflareWallet?.connected ? (
            <button className="primary-btn">Disconnect</button>
          ) : (
            <button className="primary-btn" onClick={afterConnect}>
              Connect
            </button>
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
