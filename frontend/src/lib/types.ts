export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  account_id: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface HostedZone {
  id: string;
  name: string;
  comment: string;
  private_zone: boolean;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface DNSRecord {
  id: string;
  zone_id: string;
  name: string;
  type: string;
  ttl: number;
  value: string;
  routing_policy: string;
  set_identifier: string;
  created_at: string;
  updated_at: string;
}

export type RecordType = "A" | "AAAA" | "CNAME" | "TXT" | "MX" | "NS" | "PTR" | "SRV" | "CAA";

export const RECORD_TYPES: RecordType[] = [
  "A",
  "AAAA",
  "CNAME",
  "TXT",
  "MX",
  "NS",
  "PTR",
  "SRV",
  "CAA",
];

export const ROUTING_POLICIES = ["Simple", "Weighted", "Latency", "Failover", "Geolocation"] as const;
