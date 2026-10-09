export type ItemType = "LOST" | "FOUND";
export type ItemStatus = "OPEN" | "CLAIMED" | "RETURNED" | "ARCHIVED";
export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";
export type UserRole = "USER" | "ADMIN";

export interface UserSummary {
  id: string;
  name: string;
  email?: string;
  role?: UserRole;
  createdAt?: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  type: ItemType;
  status: ItemStatus;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  dateOccurred: string;
  imageUrl?: string | null;
  contactInfo?: string | null;
  createdAt: string;
  user: UserSummary;
  _count?: {
    claims: number;
  };
}

export interface Claim {
  id: string;
  message: string;
  status: ClaimStatus;
  verificationNotes?: string | null;
  createdAt: string;
  itemId: string;
  claimantId: string;
  claimant?: UserSummary;
  item?: Item;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  reason: string;
  details?: string | null;
  status: ReportStatus;
  createdAt: string;
  itemId: string;
  reporterId: string;
  item?: Item;
  reporter?: UserSummary;
}

export interface AdminStats {
  totalUsers: number;
  totalItems: number;
  totalClaims: number;
  pendingClaims: number;
  itemsByType: Array<{ type: ItemType; _count: number }>;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}
