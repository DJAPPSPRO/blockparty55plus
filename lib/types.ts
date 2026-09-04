export type SessionUser = {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: "user" | "admin";
};

export type CommentItem = {
  id: number;
  postId: number;
  authorName: string;
  body: string;
  createdAt: string;
};

export type PostItem = {
  id: number;
  userId: number | null;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  location: string;
  likesCount: number;
  createdAt: string;
  comments: CommentItem[];
};

export type InvitationResponse = "pending" | "accepted" | "maybe" | "declined";

export type InvitationItem = {
  id: number;
  hostName: string;
  title: string;
  details: string;
  eventAt: string;
  location: string;
  response: InvitationResponse;
  createdAt: string;
};
