"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Roster, RosterFormData } from "@/types";
import {
  loadRosters,
  addRoster,
  updateRoster,
  deleteRoster,
} from "@/utils/rosterStorage";

export default function RosterPage() {
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRoster, setEditingRoster] = useState<Roster | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load rosters on component mount
  useEffect(() => {
    try {
      const loadedRosters = loadRosters();
      setRosters(loadedRosters);
    } catch (err) {
      setError("Failed to load rosters");
      console.error("Failed to load rosters:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateRoster = (formData: RosterFormData) => {
    const newRoster = addRoster(formData);
    if (newRoster) {
      setRosters((prev) => [...prev, newRoster]);
      setShowCreateForm(false);
      setSuccess("Roster created successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError("Failed to create roster. Name may already exist.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateRoster = (rosterId: string, formData: RosterFormData) => {
    if (updateRoster(rosterId, formData)) {
      const updatedRosters = loadRosters();
      setRosters(updatedRosters);
      setEditingRoster(null);
      setSuccess("Roster updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError("Failed to update roster. Name may already exist.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteRoster = (rosterId: string) => {
    if (deleteRoster(rosterId)) {
      setRosters((prev) => prev.filter((roster) => roster.id !== rosterId));
      setDeleteConfirm(null);
      setSuccess("Roster deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError("Failed to delete roster");
      setTimeout(() => setError(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rosters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Roster Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Create and manage runner rosters for quick race setup
              </p>
            </div>
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Timer
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-green-600 mr-2">✅</div>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">⚠️</div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Create Roster Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Your Rosters ({rosters.length})
          </h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create New Roster
          </button>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingRoster) && (
          <RosterForm
            roster={editingRoster}
            onSubmit={
              editingRoster
                ? (formData) => handleUpdateRoster(editingRoster.id, formData)
                : handleCreateRoster
            }
            onCancel={() => {
              setShowCreateForm(false);
              setEditingRoster(null);
            }}
          />
        )}

        {/* Rosters List */}
        {rosters.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No rosters yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first roster to save runner lists for quick race setup
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Create First Roster
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rosters.map((roster) => (
              <RosterCard
                key={roster.id}
                roster={roster}
                onEdit={() => setEditingRoster(roster)}
                onDelete={() => setDeleteConfirm(roster.id)}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <DeleteConfirmModal
            roster={rosters.find((r) => r.id === deleteConfirm)!}
            onConfirm={() => handleDeleteRoster(deleteConfirm)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </main>
    </div>
  );
}

// Roster Form Component
interface RosterFormProps {
  roster?: Roster | null;
  onSubmit: (formData: RosterFormData) => void;
  onCancel: () => void;
}

function RosterForm({ roster, onSubmit, onCancel }: RosterFormProps) {
  const [formData, setFormData] = useState<RosterFormData>({
    name: roster?.name || "",
    description: roster?.description || "",
    runners: roster?.runners || [""],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Roster name is required");
      return;
    }

    const validRunners = formData.runners.filter(
      (name) => name.trim().length > 0
    );
    if (validRunners.length === 0) {
      alert("At least one runner is required");
      return;
    }

    onSubmit({
      ...formData,
      runners: validRunners,
    });
  };

  const addRunner = () => {
    setFormData((prev) => ({
      ...prev,
      runners: [...prev.runners, ""],
    }));
  };

  const removeRunner = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      runners: prev.runners.filter((_, i) => i !== index),
    }));
  };

  const updateRunner = (index: number, name: string) => {
    setFormData((prev) => ({
      ...prev,
      runners: prev.runners.map((runner, i) => (i === index ? name : runner)),
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {roster ? "Edit Roster" : "Create New Roster"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Roster Name */}
        <div>
          <label
            htmlFor="roster-name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Roster Name *
          </label>
          <input
            id="roster-name"
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g., Varsity Team, JV Squad"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="roster-description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description (Optional)
          </label>
          <textarea
            id="roster-description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Brief description of this roster"
            rows={2}
          />
        </div>

        {/* Runners */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Runners *
          </label>
          <div className="space-y-2">
            {formData.runners.map((runner, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={runner}
                  onChange={(e) => updateRunner(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={`Runner ${index + 1} name`}
                />
                {formData.runners.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRunner(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRunner}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            + Add Another Runner
          </button>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {roster ? "Update Roster" : "Create Roster"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// Roster Card Component
interface RosterCardProps {
  roster: Roster;
  onEdit: () => void;
  onDelete: () => void;
}

function RosterCard({ roster, onEdit, onDelete }: RosterCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{roster.name}</h3>
          {roster.description && (
            <p className="text-sm text-gray-600 mt-1">{roster.description}</p>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit roster"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete roster"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-medium">{roster.runners.length}</span>
          <span className="ml-1">
            runner{roster.runners.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="max-h-24 overflow-y-auto">
          <div className="flex flex-wrap gap-1">
            {roster.runners.slice(0, 6).map((runner, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
              >
                {runner}
              </span>
            ))}
            {roster.runners.length > 6 && (
              <span className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
                +{roster.runners.length - 6} more
              </span>
            )}
          </div>
        </div>

        <Link
          href={`/?roster=${roster.id}`}
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-lg font-medium transition-colors text-sm"
        >
          Use This Roster
        </Link>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
interface DeleteConfirmModalProps {
  roster: Roster;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmModal({
  roster,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Delete Roster?
          </h3>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete "{roster.name}"? This action cannot
            be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Delete Roster
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
