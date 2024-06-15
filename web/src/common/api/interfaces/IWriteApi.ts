import { UploadResponse } from "@irys/sdk/common/types";
import {
  ActionType,
  Avatar,
  Bundle,
  ProfileModel,
} from "../irys/models/ApiModels";

export interface IWriteApi {
  get Address(): string;

  arbitraryFund(amount: number): Promise<void>;

  /// Loaded balance on Irys
  balance(): Promise<number>;

  uploadBundles(bundles: Bundle[]): Promise<UploadResponse | undefined>;

  addWork(
    title: string,
    /// if undefined use first few words of content
    description: string | undefined,
    /// should be html
    content: string,
    authorId: string,
    action?: ActionType,
    fund?: boolean
  ): Promise<UploadResponse>;

  updateWork(
    title: string,
    description: string | undefined,
    content: string,
    authorId: string,
    priorWorkId: string,
    fund?: boolean
  ): Promise<UploadResponse>;

  addProfile(
    userName: string,
    fullName: string,
    description: string,
    action?: ActionType,
    fund?: boolean,
    socialLinkPrimary?: string,
    socialLinkSecondary?: string,
    avatar?: Avatar
  ): Promise<UploadResponse>;

  updateProfile(
    profileId: string,
    userName: string,
    fullName: string,
    description: string,
    fund?: boolean,
    socialLinkPrimary?: string,
    socialLinkSecondary?: string,
    avatar?: Avatar
  ): Promise<UploadResponse>;

  getOwnersProfile(): Promise<ProfileModel | null>;

  addWorkResponse(
    content: string,
    workId: string,
    responderId: string,
    action?: ActionType,
    fund?: boolean
  ): Promise<UploadResponse>;

  isConnected(): Promise<boolean>;
  disconnect(): void;
  connect(walletProvider?: object | null): Promise<void>;

  addFollow(
    followerId: string,
    followedId: string,
    action?: ActionType,
    fund?: boolean
  ): Promise<UploadResponse>;
  removeFollow(
    followerId: string,
    followedId: string,
    fund?: boolean
  ): Promise<UploadResponse>;

  addTopic(
    name: string,
    action?: ActionType,
    fund?: boolean
  ): Promise<UploadResponse>;
  removeTopic(name: string, fund?: boolean): Promise<UploadResponse>;

  addWorkTopic(
    topicId: string,
    workId: string,
    action?: ActionType,
    fund?: boolean
  ): Promise<UploadResponse>;
  removeWorkTopic(
    topicId: string,
    workId: string,
    fund?: boolean
  ): Promise<UploadResponse>;

  addWorkLike(
    workId: string,
    likerId: string,
    action?: ActionType,
    fund?: boolean
  ): Promise<UploadResponse>;
  removeWorkLike(
    workId: string,
    likerId: string,
    fund?: boolean
  ): Promise<UploadResponse>;

  /// Used to wait for tx completion and then get entity id
  // waitAndGetId(
  //   tx: string | null | undefined,
  //   entityType?: string
  // ): Promise<number>;

  // cleanDb(): TxHashPromise;
  // setupData(): TxHashPromise;
}
