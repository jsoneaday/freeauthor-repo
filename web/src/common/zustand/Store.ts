import { create } from "zustand";
import { Profile } from "./Profile";

export type ProfileStore = {
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
};

export type NotificationStore = {
  isOpen: boolean;
  toggleNotification: () => void;
};

export const useProfile = create<ProfileStore>((set) => ({
  profile: null,
  setProfile: (profile: Profile) => set((_state) => ({ profile })),
}));

export const useNotification = create<NotificationStore>((set) => ({
  isOpen: false,
  toggleNotification: () => set((state) => ({ isOpen: !state.isOpen })),
}));
