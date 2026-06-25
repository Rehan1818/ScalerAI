import type { DNSRecord, HostedZone, PaginatedResponse, User } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(body.detail || "Request failed", res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<{ user: User; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: (token: string) =>
    request<{ message: string }>(
      "/api/auth/logout",
      { method: "POST" },
      token
    ),

  me: (token: string) => request<User>("/api/auth/me", {}, token),

  listZones: (token: string, params: { search?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return request<PaginatedResponse<HostedZone>>(`/api/hosted-zones?${qs}`, {}, token);
  },

  getZone: (token: string, zoneId: string) =>
    request<HostedZone>(`/api/hosted-zones/${zoneId}`, {}, token),

  createZone: (token: string, data: { name: string; comment?: string; private_zone?: boolean }) =>
    request<HostedZone>(
      "/api/hosted-zones",
      { method: "POST", body: JSON.stringify(data) },
      token
    ),

  updateZone: (token: string, zoneId: string, data: { comment?: string; private_zone?: boolean }) =>
    request<HostedZone>(
      `/api/hosted-zones/${zoneId}`,
      { method: "PATCH", body: JSON.stringify(data) },
      token
    ),

  deleteZone: (token: string, zoneId: string) =>
    request<{ message: string }>(
      `/api/hosted-zones/${zoneId}`,
      { method: "DELETE" },
      token
    ),

  listRecords: (
    token: string,
    zoneId: string,
    params: { search?: string; type?: string; page?: number; limit?: number }
  ) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.type) qs.set("type", params.type);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return request<PaginatedResponse<DNSRecord>>(
      `/api/hosted-zones/${zoneId}/records?${qs}`,
      {},
      token
    );
  },

  createRecord: (
    token: string,
    zoneId: string,
    data: {
      name: string;
      type: string;
      ttl: number;
      value: string;
      routing_policy?: string;
      set_identifier?: string;
    }
  ) =>
    request<DNSRecord>(
      `/api/hosted-zones/${zoneId}/records`,
      { method: "POST", body: JSON.stringify(data) },
      token
    ),

  updateRecord: (
    token: string,
    zoneId: string,
    recordId: string,
    data: Partial<{
      name: string;
      type: string;
      ttl: number;
      value: string;
      routing_policy: string;
      set_identifier: string;
    }>
  ) =>
    request<DNSRecord>(
      `/api/hosted-zones/${zoneId}/records/${recordId}`,
      { method: "PATCH", body: JSON.stringify(data) },
      token
    ),

  deleteRecord: (token: string, zoneId: string, recordId: string) =>
    request<{ message: string }>(
      `/api/hosted-zones/${zoneId}/records/${recordId}`,
      { method: "DELETE" },
      token
    ),
};

export { ApiError };
