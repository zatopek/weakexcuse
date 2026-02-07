// DB enum types
export type IncidentType =
  | "last_minute_cancel"
  | "ghosted"
  | "late_af"
  | "maybe_merchant"
  | "weak_excuse";

export type Severity = "mild" | "bad" | "criminal";

export type IncidentStatus =
  | "pending"
  | "accepted"
  | "confirmed"
  | "disputed"
  | "rejected"
  | "expired";

export type GroupMemberRole = "owner" | "member";

export type ReactionEmoji = "laugh" | "cry" | "skull" | "handshake";

// Table row types
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  invite_code: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
  joined_at: Date;
  left_at: Date | null;
}

export interface Incident {
  id: string;
  group_id: string;
  accused_id: string;
  accuser_id: string;
  type: IncidentType;
  severity: Severity;
  note: string | null;
  status: IncidentStatus;
  is_self_report: boolean;
  points: number;
  expires_at: Date;
  scored_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Vote {
  id: string;
  incident_id: string;
  user_id: string;
  confirm: boolean;
  created_at: Date;
}

export interface Reaction {
  id: string;
  incident_id: string;
  user_id: string;
  emoji: ReactionEmoji;
  created_at: Date;
}

// Incident type display mapping
export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  last_minute_cancel: "Last-minute cancel",
  ghosted: "Ghosted",
  late_af: "Late AF",
  maybe_merchant: '"Maybe" merchant',
  weak_excuse: "Weak excuse",
};

export const INCIDENT_TYPE_EMOJI: Record<IncidentType, string> = {
  last_minute_cancel: "❌",
  ghosted: "👻",
  late_af: "🕰️",
  maybe_merchant: "🤡",
  weak_excuse: "🧢",
};

export const SEVERITY_POINTS: Record<Severity, number> = {
  mild: 1,
  bad: 2,
  criminal: 3,
};

export const REACTION_EMOJI_MAP: Record<ReactionEmoji, string> = {
  laugh: "😂",
  cry: "😭",
  skull: "💀",
  handshake: "🤝",
};
