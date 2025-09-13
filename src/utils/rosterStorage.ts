import { Roster, RosterFormData } from "@/types";

// Key for localStorage
const ROSTER_STORAGE_KEY = "cross-country-timer-rosters";

/**
 * Generate a unique ID for a roster
 */
function generateRosterId(): string {
  return `roster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate roster data structure
 */
function isValidRoster(roster: any): roster is Roster {
  if (!roster || typeof roster !== "object") {
    return false;
  }

  return (
    typeof roster.id === "string" &&
    typeof roster.name === "string" &&
    Array.isArray(roster.runners) &&
    roster.runners.every((runner: any) => typeof runner === "string") &&
    typeof roster.createdAt === "number" &&
    typeof roster.updatedAt === "number" &&
    (roster.description === undefined || typeof roster.description === "string")
  );
}

/**
 * Load all rosters from localStorage
 */
export function loadRosters(): Roster[] {
  try {
    const stored = localStorage.getItem(ROSTER_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.warn("Invalid roster data structure, clearing storage");
      clearRosters();
      return [];
    }

    // Validate each roster
    const validRosters = parsed.filter((roster) => {
      if (!isValidRoster(roster)) {
        console.warn("Invalid roster found, skipping:", roster);
        return false;
      }
      return true;
    });

    return validRosters;
  } catch (error) {
    console.warn("Failed to load rosters from localStorage:", error);
    clearRosters();
    return [];
  }
}

/**
 * Save all rosters to localStorage
 */
export function saveRosters(rosters: Roster[]): boolean {
  try {
    // Validate input
    if (!Array.isArray(rosters)) {
      console.warn("Invalid rosters data - not an array");
      return false;
    }

    // Validate each roster
    const validRosters = rosters.filter(isValidRoster);
    if (validRosters.length !== rosters.length) {
      console.warn("Some rosters were invalid and excluded from save");
    }

    const serialized = JSON.stringify(validRosters);

    // Check size limit (localStorage is usually 5-10MB)
    if (serialized.length > 5 * 1024 * 1024) {
      console.warn("Roster data too large to save to localStorage");
      return false;
    }

    localStorage.setItem(ROSTER_STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.warn("Failed to save rosters to localStorage:", error);
    return false;
  }
}

/**
 * Create a new roster
 */
export function createRoster(formData: RosterFormData): Roster {
  const now = Date.now();

  return {
    id: generateRosterId(),
    name: formData.name.trim(),
    description: formData.description?.trim() || undefined,
    runners: formData.runners
      .map((name) => name.trim())
      .filter((name) => name.length > 0),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Add a new roster and save to storage
 */
export function addRoster(formData: RosterFormData): Roster | null {
  try {
    const newRoster = createRoster(formData);
    const existingRosters = loadRosters();

    // Check for duplicate names
    if (
      existingRosters.some(
        (roster) => roster.name.toLowerCase() === newRoster.name.toLowerCase()
      )
    ) {
      throw new Error("A roster with this name already exists");
    }

    const updatedRosters = [...existingRosters, newRoster];

    if (saveRosters(updatedRosters)) {
      return newRoster;
    } else {
      throw new Error("Failed to save roster to storage");
    }
  } catch (error) {
    console.error("Failed to add roster:", error);
    return null;
  }
}

/**
 * Update an existing roster
 */
export function updateRoster(
  rosterId: string,
  formData: RosterFormData
): boolean {
  try {
    const rosters = loadRosters();
    const rosterIndex = rosters.findIndex((roster) => roster.id === rosterId);

    if (rosterIndex === -1) {
      throw new Error("Roster not found");
    }

    // Check for duplicate names (excluding current roster)
    const nameExists = rosters.some(
      (roster, index) =>
        index !== rosterIndex &&
        roster.name.toLowerCase() === formData.name.trim().toLowerCase()
    );

    if (nameExists) {
      throw new Error("A roster with this name already exists");
    }

    // Update the roster
    rosters[rosterIndex] = {
      ...rosters[rosterIndex],
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      runners: formData.runners
        .map((name) => name.trim())
        .filter((name) => name.length > 0),
      updatedAt: Date.now(),
    };

    return saveRosters(rosters);
  } catch (error) {
    console.error("Failed to update roster:", error);
    return false;
  }
}

/**
 * Delete a roster
 */
export function deleteRoster(rosterId: string): boolean {
  try {
    const rosters = loadRosters();
    const filteredRosters = rosters.filter((roster) => roster.id !== rosterId);

    if (filteredRosters.length === rosters.length) {
      throw new Error("Roster not found");
    }

    return saveRosters(filteredRosters);
  } catch (error) {
    console.error("Failed to delete roster:", error);
    return false;
  }
}

/**
 * Get a specific roster by ID
 */
export function getRosterById(rosterId: string): Roster | null {
  try {
    const rosters = loadRosters();
    return rosters.find((roster) => roster.id === rosterId) || null;
  } catch (error) {
    console.error("Failed to get roster:", error);
    return null;
  }
}

/**
 * Clear all rosters from localStorage
 */
export function clearRosters(): void {
  try {
    localStorage.removeItem(ROSTER_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear rosters from localStorage:", error);
  }
}

/**
 * Export rosters as JSON for backup
 */
export function exportRosters(): string {
  const rosters = loadRosters();
  return JSON.stringify(rosters, null, 2);
}

/**
 * Import rosters from JSON backup
 */
export function importRosters(jsonData: string): boolean {
  try {
    const importedRosters = JSON.parse(jsonData);

    if (!Array.isArray(importedRosters)) {
      throw new Error("Invalid JSON format - expected array");
    }

    // Validate imported rosters
    const validRosters = importedRosters.filter(isValidRoster);

    if (validRosters.length === 0) {
      throw new Error("No valid rosters found in import data");
    }

    // Merge with existing rosters, avoiding duplicates
    const existingRosters = loadRosters();
    const existingNames = new Set(
      existingRosters.map((r) => r.name.toLowerCase())
    );

    const newRosters = validRosters.filter(
      (roster) => !existingNames.has(roster.name.toLowerCase())
    );

    if (newRosters.length === 0) {
      throw new Error("All imported rosters already exist");
    }

    const allRosters = [...existingRosters, ...newRosters];
    return saveRosters(allRosters);
  } catch (error) {
    console.error("Failed to import rosters:", error);
    return false;
  }
}
