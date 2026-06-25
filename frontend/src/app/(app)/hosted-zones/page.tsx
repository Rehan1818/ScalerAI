"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Search, Trash2, Pencil } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api, ApiError } from "@/lib/api";
import type { HostedZone } from "@/lib/types";

export default function HostedZonesPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editZone, setEditZone] = useState<HostedZone | null>(null);
  const [deleteZone, setDeleteZone] = useState<HostedZone | null>(null);

  const [formName, setFormName] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formPrivate, setFormPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchZones = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.listZones(token, { search, page, limit: 10 });
      setZones(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch (err) {
      showToast(err instanceof ApiError ? String(err.message) : "Failed to load zones", "error");
    } finally {
      setLoading(false);
    }
  }, [token, search, page, showToast]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const resetForm = () => {
    setFormName("");
    setFormComment("");
    setFormPrivate(false);
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
      await api.createZone(token, {
        name: formName,
        comment: formComment,
        private_zone: formPrivate,
      });
      showToast("Hosted zone created successfully");
      setCreateOpen(false);
      resetForm();
      fetchZones();
    } catch (err) {
      showToast(err instanceof ApiError ? String(err.message) : "Create failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !editZone) return;
    setSubmitting(true);
    try {
      await api.updateZone(token, editZone.id, {
        comment: formComment,
        private_zone: formPrivate,
      });
      showToast("Hosted zone updated successfully");
      setEditZone(null);
      resetForm();
      fetchZones();
    } catch (err) {
      showToast(err instanceof ApiError ? String(err.message) : "Update failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !deleteZone) return;
    setSubmitting(true);
    try {
      await api.deleteZone(token, deleteZone.id);
      showToast("Hosted zone deleted successfully");
      setDeleteZone(null);
      fetchZones();
    } catch (err) {
      showToast(err instanceof ApiError ? String(err.message) : "Delete failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (zone: HostedZone) => {
    setFormComment(zone.comment);
    setFormPrivate(zone.private_zone);
    setEditZone(zone);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Hosted zones" }]} />

      <div className="aws-page-header">
        <div>
          <h1 className="aws-page-title">Hosted zones</h1>
          <p className="mt-1 text-sm text-[#545b64]">
            A hosted zone is a container for records that define how you want to route traffic for a domain.
          </p>
        </div>
        <button className="aws-btn-primary" onClick={() => { resetForm(); setCreateOpen(true); }}>
          <Plus className="h-4 w-4" />
          Create hosted zone
        </button>
      </div>

      <div className="aws-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eaeded] px-4 py-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#545b64]" />
              <input
                className="aws-input pl-8 !w-64"
                placeholder="Filter hosted zones"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <button type="submit" className="aws-btn-secondary">Search</button>
          </form>
          <button className="aws-btn-secondary" onClick={fetchZones}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="aws-table">
            <thead>
              <tr>
                <th>Hosted zone name</th>
                <th>Type</th>
                <th>Record count</th>
                <th>Description</th>
                <th>Hosted zone ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#545b64]">
                    Loading hosted zones...
                  </td>
                </tr>
              ) : zones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#545b64]">
                    No hosted zones found. Create one to get started.
                  </td>
                </tr>
              ) : (
                zones.map((zone) => (
                  <tr key={zone.id}>
                    <td>
                      <Link href={`/hosted-zones/${zone.id}`} className="aws-btn-link font-medium">
                        {zone.name}
                      </Link>
                    </td>
                    <td>
                      <span className={`aws-badge ${zone.private_zone ? "bg-[#eee]" : "bg-[#e7f6fd] text-[#0073bb]"}`}>
                        {zone.private_zone ? "Private" : "Public"}
                      </span>
                    </td>
                    <td>{zone.record_count}</td>
                    <td className="max-w-xs truncate text-[#545b64]">{zone.comment || "—"}</td>
                    <td className="font-mono text-xs text-[#545b64]">{zone.id}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="aws-btn-link" onClick={() => openEdit(zone)}>
                          <Pencil className="inline h-3.5 w-3.5" /> Edit
                        </button>
                        <button className="text-sm text-[#d13212] hover:underline" onClick={() => setDeleteZone(zone)}>
                          <Trash2 className="inline h-3.5 w-3.5" /> Delete
                        </button>
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

      {/* Create Modal */}
      <Modal
        open={createOpen}
        title="Create hosted zone"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button className="aws-btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="aws-btn-primary" form="create-zone-form" disabled={submitting}>
              {submitting ? "Creating..." : "Create hosted zone"}
            </button>
          </>
        }
      >
        <form id="create-zone-form" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Domain name</label>
            <input
              className="aws-input"
              placeholder="example.com"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-[#545b64]">Enter a domain name (e.g., example.com)</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Comment</label>
            <textarea
              className="aws-input min-h-[80px]"
              value={formComment}
              onChange={(e) => setFormComment(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formPrivate} onChange={(e) => setFormPrivate(e.target.checked)} />
            Private hosted zone
          </label>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editZone}
        title="Edit hosted zone"
        onClose={() => setEditZone(null)}
        footer={
          <>
            <button className="aws-btn-secondary" onClick={() => setEditZone(null)}>Cancel</button>
            <button className="aws-btn-primary" form="edit-zone-form" disabled={submitting}>
              {submitting ? "Saving..." : "Save changes"}
            </button>
          </>
        }
      >
        <form id="edit-zone-form" onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Domain name</label>
            <input className="aws-input bg-[#f2f3f3]" value={editZone?.name || ""} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Comment</label>
            <textarea
              className="aws-input min-h-[80px]"
              value={formComment}
              onChange={(e) => setFormComment(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formPrivate} onChange={(e) => setFormPrivate(e.target.checked)} />
            Private hosted zone
          </label>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deleteZone}
        title="Delete hosted zone"
        onClose={() => setDeleteZone(null)}
        footer={
          <>
            <button className="aws-btn-secondary" onClick={() => setDeleteZone(null)}>Cancel</button>
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
        <p className="text-sm text-[#16191f]">
          Are you sure you want to delete hosted zone <strong>{deleteZone?.name}</strong>?
          This will permanently delete all records in this zone.
        </p>
      </Modal>
    </div>
  );
}
