import { UserSummary, Item, Claim, NotificationItem, ReportItem, AdminStats, Pagination } from "../types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export class ApiError extends Error {
  statusCode: number;
  errors?: Array<{ field: string; message: string }>;

  constructor(message: string, statusCode: number, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

function getStoredToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

export function setStoredToken(token: string | null): void {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message || "An unexpected error occurred",
      response.status,
      data.errors
    );
  }

  return data as T;
}

export const api = {
  // Health
  getHealth: () => request<{ success: boolean; message: string; database: string }>("/health"),

  // Auth
  register: (name: string, email: string, password: string) =>
    request<{ success: boolean; user: UserSummary; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ success: boolean; user: UserSummary; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ success: boolean; message: string }>("/auth/logout", {
      method: "POST",
    }),

  getMe: () => request<{ success: boolean; user: UserSummary }>("/auth/me"),

  // Items
  getItems: (params: Record<string, string | number | undefined> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== "") {
        query.append(key, String(val));
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ success: boolean; items: Item[]; pagination: Pagination }>(`/items${qs}`);
  },

  getItem: (id: string) => request<{ success: boolean; item: Item }>(`/items/${id}`),

  createItem: (itemData: Record<string, unknown>) =>
    request<{ success: boolean; item: Item; message: string }>("/items", {
      method: "POST",
      body: JSON.stringify(itemData),
    }),

  updateItem: (id: string, itemData: Record<string, unknown>) =>
    request<{ success: boolean; item: Item; message: string }>(`/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(itemData),
    }),

  deleteItem: (id: string) =>
    request<{ success: boolean; message: string }>(`/items/${id}`, {
      method: "DELETE",
    }),

  // Claims
  submitClaim: (itemId: string, message: string, verificationNotes?: string) =>
    request<{ success: boolean; claim: Claim; message: string }>(`/claims/items/${itemId}/claims`, {
      method: "POST",
      body: JSON.stringify({ message, verificationNotes }),
    }),

  getMyClaims: () => request<{ success: boolean; claims: Claim[] }>("/claims/mine"),

  getItemClaims: (itemId: string) =>
    request<{ success: boolean; claims: Claim[] }>(`/claims/items/${itemId}/claims`),

  updateClaimStatus: (claimId: string, status: "APPROVED" | "REJECTED", verificationNotes?: string) =>
    request<{ success: boolean; claim: Claim; message: string }>(`/claims/${claimId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, verificationNotes }),
    }),

  // User Profile
  getProfile: () => request<{ success: boolean; user: UserSummary; myItems: Item[]; notifications: NotificationItem[] }>("/users/me"),

  // Matching Suggestions
  getItemMatches: (id: string) =>
    request<{ success: boolean; matches: Item[]; disclaimer: string }>(`/items/${id}/matches`),

  // Abuse Reports
  submitReport: (itemId: string, reason: string, details?: string) =>
    request<{ success: boolean; message: string; report: ReportItem }>(`/items/${itemId}/reports`, {
      method: "POST",
      body: JSON.stringify({ reason, details }),
    }),

  // Admin
  getAdminStats: () =>
    request<{ success: boolean; stats: AdminStats }>("/admin/stats"),

  getAdminReports: () =>
    request<{ success: boolean; reports: ReportItem[] }>("/admin/reports"),

  updateReportStatus: (reportId: string, status: "RESOLVED" | "DISMISSED") =>
    request<{ success: boolean; message: string; report: ReportItem }>(`/admin/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
