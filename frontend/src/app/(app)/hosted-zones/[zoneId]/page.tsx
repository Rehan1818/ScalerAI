"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, RefreshCw, Search, Trash2, Pencil } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api, ApiError } from "@/lib/api";
import type { DNSRecord, HostedZone } from "@/lib/types";
import { RECORD_TYPES, ROUTING_POLICIES } from "@/lib/types";

export default function ZoneDetailPage() {
  const params = useParams();
  const zoneId = params.zoneId as string;
  const { token } = useAuth();
  const { showToast } = useToast();

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<DNSRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<DNSRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<string>("A");
  const [formTtl, setFormTtl] = useState(300);
  const [formValue, setFormValue] = useState("");
  const [formRouting, setFormRouting] = useState("Simple");
  const [formSetId, setFormSetId] = useState("");

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [zoneRes, recordsRes] = await Promise.all([
        api.getZone(token, zoneId),
        api.listRecords(token, zoneId, { search, type: typeFilter, page, limit: 20 }),
      ]);
      setZone(zoneRes);
      setRecords(recordsRes.items);
      setTotal(recordsRes.total);
      setPages(recordsRes.pages);
    } catch (err) {
      showToast(err instanceof ApiError ? String(err.message) : "Failed to load records", "error");
    } finally {
      setLoading(false);
    }
  }, [token, zoneId, search, typeFilter, page, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setFormName("");
    setFormType("A");
    setFormTtl(300);
    setFormValue("");
    setFormRouting("Simple");
    setFormSetId("");
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      await api.createRecord(token, zoneId, {
        name: formName,
        type: formType,
        ttl: formTtl,
        value: formValue,
        routing_policy: formRouting,
        set_identifier: formSetId,
      });
      showToast("Record created successfully");
      setCreateOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      showToast(err instanceof ApiError ? String(err.message) : "Create failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !editRecord) return;
    setSubmitting(true);
    try {
      await api.updateRecord(token, zoneId, editRecord.id, {
        name: formName,
        type: formType,
        ttl: formTtl,
        value: formValue,
        routing_policy: formRouting,
        set_identifier: formSetId,
      });
      showToast("Record updated successfully");
      setEditRecord(null);
      resetForm();
      fetchData();
    } catch (err) {
      showToast(err instanceof ApiError ? String(err.message) : "Update failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !deleteRecord) return;
    setSubmitting(true);
    try {
      await api.deleteRecord(token, zoneId, deleteRecord.id);
      showToast("Record deleted successfully");
      setDeleteRecord(null);
      fetchData();
    } catch (err) {
      showToast(err instanceof ApiError ? String(err.message) : "Delete failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (record: DNSRecord) => {
    setFormName(record.name);
    setFormType(record.type);
    setFormTtl(record.ttl);
    setFormValue(record.value);
    setFormRouting(record.routing_policy);
    setFormSetId(record.set_identifier);
    setEditRecord(record);
  };

  const isSystemRecord = (r: DNSRecord) => r.type === "NS" || r.type === "SOA";

  const recordForm = (formId: string, onSubmit: (e: FormEvent) => void, isEdit: boolean) => (
    <form id={formId} onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Record name</label>
        <input
          className="aws-input"
          placeholder={`subdomain.${zone?.name || "example.com"}`}
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Record type</label>
          <select
            className="aws-input"
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
            disabled={isEdit && editRecord ? isSystemRecord(editRecord) : false}
          >
            {RECORD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">TTL (seconds)</label>
          <input
            className="aws-input"
            type="number"
            min={0}
            value={formTtl}
            onChange={(e) => setFormTtl(Number(e.target.value))}
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Value</label>
        <textarea
          className="aws-input min-h-[100px] font-mono text-xs"
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Routing policy</label>
          <select
            className="aws-input"
            value={formRouting}
            onChange={(e) => setFormRouting(e.target.value)}
          >
            {ROUTING_POLICIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Set identifier</label>
          <input
            className="aws-input"
            value={formSetId}
            onChange={(e) => setFormSetId(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>
    </form>
  );

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Hosted zones", href: "/hosted-zones" },
          { label: zone?.name || zoneId },
        ]}
      />

      <div className="aws-page-header">
        <div>
          <h1 className="aws-page-title">{zone?.name || "Hosted zone"}</h1>
          <p className="mt-1 text-sm text-[#545b64]">
            Hosted zone ID: <span className="font-mono">{zoneId}</span>
            {zone?.comment && <> · {zone.comment}</>}
          </p>
        </div>
        <button className="aws-btn-primary" onClick={() => { resetForm(); setCreateOpen(true); }}>
          <Plus className="h-4 w-4" />
          Create record
        </button>
      </div>

      <div className="aws-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eaeded] px-4 py-3">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#545b64]" />
              <input
                className="aws-input pl-8 !w-56"
                placeholder="Filter records"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <select
              className="aws-input !w-auto"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="">All types</option>
              {RECORD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button type="submit" className="aws-btn-secondary">Search</button>
          </form>
          <button className="aws-btn-secondary" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="aws-table">
            <thead>
              <tr>
                <th>Record name</th>
                <th>Type</th>
                <th>Routing policy</th>
                <th>Differentiator</th>
                <th>Alias</th>
                <th>Value/Route traffic to</th>
                <th>TTL (seconds)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#545b64]">Loading records...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#545b64]">No records found.</td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td className="font-medium">{record.name}</td>
                    <td>
                      <span className="aws-badge bg-[#eee] font-mono">{record.type}</span>
                    </td>
                    <td>{record.routing_policy}</td>
                    <td className="text-[#545b64]">{record.set_identifier || "—"}</td>
                    <td className="text-[#545b64]">No</td>
                    <td className="max-w-xs whitespace-pre-wrap break-all font-mono text-xs">
                      {record.value}
                    </td>
                    <td>{record.ttl}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="aws-btn-link" onClick={() => openEdit(record)}>
                          <Pencil className="inline h-3.5 w-3.5" /> Edit
                        </button>
                        {!isSystemRecord(record) && (
                          <button
                            className="text-sm text-[#d13212] hover:underline"
                            onClick={() => setDeleteRecord(record)}
                          >
                            <Trash2 className="inline h-3.5 w-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
      </div>

      <Modal
        open={createOpen}
        title="Create record"
        onClose={() => setCreateOpen(false)}
        wide
        footer={
          <>
            <button className="aws-btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="aws-btn-primary" form="create-record-form" disabled={submitting}>
              {submitting ? "Creating..." : "Create records"}
            </button>
          </>
        }
      >
        {recordForm("create-record-form", handleCreate, false)}
      </Modal>

      <Modal
        open={!!editRecord}
        title="Edit record"
        onClose={() => setEditRecord(null)}
        wide
        footer={
          <>
            <button className="aws-btn-secondary" onClick={() => setEditRecord(null)}>Cancel</button>
            <button className="aws-btn-primary" form="edit-record-form" disabled={submitting}>
              {submitting ? "Saving..." : "Save changes"}
            </button>
          </>
        }
      >
        {recordForm("edit-record-form", handleEdit, true)}
      </Modal>

      <Modal
        open={!!deleteRecord}
        title="Delete record"
        onClose={() => setDeleteRecord(null)}
        footer={
          <>
            <button className="aws-btn-secondary" onClick={() => setDeleteRecord(null)}>Cancel</button>
            <button
              className="inline-flex items-center rounded border border-[#d13212] bg-[#d13212] px-4 py-1.5 text-sm text-white hover:bg-[#ba2e0f] disabled:opacity-50"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-sm">
          Delete record <strong>{deleteRecord?.name}</strong> ({deleteRecord?.type})?
        </p>
      </Modal>
    </div>
  );
}
