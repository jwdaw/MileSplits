"use client";

import { useState } from "react";
import { Runner } from "@/types";

interface AddRunnerProps {
  runners: Runner[];
  onAddRunner: (runner: Runner) => void;
}

export default function AddRunner({ runners, onAddRunner }: AddRunnerProps) {
  const [runnerName, setRunnerName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const generateUniqueId = (): string => {
    return `runner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const validateRunnerName = (name: string): string | null => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return "Runner name cannot be empty";
    }

    if (trimmedName.length < 2) {
      return "Runner name must be at least 2 characters";
    }

    if (trimmedName.length > 50) {
      return "Runner name must be less than 50 characters";
    }

    if (!/^[a-zA-Z0-9\s\-'\.]+$/.test(trimmedName)) {
      return "Runner name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods";
    }

    if (
      runners.some(
        (runner) => runner.name.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      return "Runner name already exists";
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateRunnerName(runnerName);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const newRunner: Runner = {
        id: generateUniqueId(),
        name: runnerName.trim(),
        splits: {},
      };

      onAddRunner(newRunner);
      setRunnerName("");
      setSuccess(`${newRunner.name} added successfully!`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to add runner. Please try again.");
      console.error("Add runner error:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRunnerName(e.target.value);
    if (error) {
      setError(""); // Clear error when user starts typing
    }
    if (success) {
      setSuccess(""); // Clear success when user starts typing
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="runner-name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Add Runner
          </label>
          <input
            id="runner-name"
            type="text"
            value={runnerName}
            onChange={handleInputChange}
            placeholder="Enter runner name"
            className={`w-full px-4 py-3 text-base sm:text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors touch-target ${
              error ? "border-red-500" : "border-gray-300"
            }`}
            style={{ minHeight: "48px", fontSize: "16px" }} // Ensure minimum touch target size and prevent zoom on iOS
          />
          {error && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="mt-2 text-sm text-green-600" role="status">
              {success}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none touch-target"
          style={{ minHeight: "48px" }} // Ensure minimum touch target size
        >
          Add Runner
        </button>
      </form>

      {runners.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            {runners.length} runner{runners.length !== 1 ? "s" : ""} added
          </p>
          <div className="flex flex-wrap gap-2">
            {runners.map((runner) => (
              <span
                key={runner.id}
                className="inline-block bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full"
              >
                {runner.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
