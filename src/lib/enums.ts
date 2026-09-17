// SQLite has no native enum type, so these fields are plain strings in the
// database. These union types give the same safety at the TypeScript layer.
export type Role = "ADMIN" | "CUSTOMER";

export type GameStatus = "OPEN" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";

export type EntryStatus = "ACTIVE" | "ELIMINATED" | "REBUY_ELIGIBLE" | "WINNER";

export type PaymentStatus = "NOT_CONFIRMED" | "PAID" | "PAYMENT_ISSUE" | "REFUNDED";

export type RoundStatus = "SCHEDULED" | "OPEN" | "CLOSED" | "COMPLETED";

export type FixtureStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "POSTPONED" | "CANCELLED" | "ABANDONED";

export type FixtureResult = "HOME" | "AWAY" | "DRAW" | "VOID";

export type SelectionOutcome = "PENDING" | "WIN" | "LOSS" | "DRAW" | "VOID";

export type MissedDeadlineAction = "AUTO_ASSIGN" | "ELIMINATE" | "NONE";

export type SelectionVisibility = "IMMEDIATE" | "HIDDEN_UNTIL_DEADLINE" | "HIDDEN_UNTIL_KICKOFF";

export type ReBuyStatus = "REQUESTED" | "APPROVED" | "REJECTED";

export type NotificationType =
  | "GAME_INVITATION"
  | "GAME_OPENING"
  | "ROUND_AVAILABLE"
  | "DEADLINE_REMINDER"
  | "FINAL_DEADLINE_REMINDER"
  | "SELECTION_CONFIRMATION"
  | "AUTO_ASSIGNMENT"
  | "FIXTURE_POSTPONED"
  | "REPLACEMENT_REQUIRED"
  | "ELIMINATED"
  | "PROGRESSED"
  | "REBUY_AVAILABLE"
  | "GAME_WINNER"
  | "ANNOUNCEMENT";
