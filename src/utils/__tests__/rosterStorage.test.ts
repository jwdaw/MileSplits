import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  loadRosters,
  saveRosters,
  addRoster,
  updateRoster,
  deleteRoster,
  getRosterById,
  clearRosters,
  createRoster,
} from "../rosterStorage";
import { Roster, RosterFormData } from "@/types";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Roster Storage Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("loadRosters", () => {
    it("should return empty array when no data in localStorage", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = loadRosters();

      expect(result).toEqual([]);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        "cross-country-timer-rosters"
      );
    });

    it("should return valid rosters from localStorage", () => {
      const mockRosters: Roster[] = [
        {
          id: "roster-1",
          name: "Test Roster",
          description: "Test Description",
          runners: ["John Doe", "Jane Smith"],
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockRosters));

      const result = loadRosters();

      expect(result).toEqual(mockRosters);
    });

    it("should filter out invalid rosters", () => {
      const mixedData = [
        {
          id: "roster-1",
          name: "Valid Roster",
          runners: ["John Doe"],
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
        {
          id: "roster-2",
          // Missing name - invalid
          runners: ["Jane Smith"],
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mixedData));

      const result = loadRosters();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Valid Roster");
    });

    it("should handle corrupted localStorage data", () => {
      localStorageMock.getItem.mockReturnValue("invalid json");

      const result = loadRosters();

      expect(result).toEqual([]);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "cross-country-timer-rosters"
      );
    });
  });

  describe("saveRosters", () => {
    it("should save valid rosters to localStorage", () => {
      const rosters: Roster[] = [
        {
          id: "roster-1",
          name: "Test Roster",
          runners: ["John Doe"],
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
      ];

      const result = saveRosters(rosters);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "cross-country-timer-rosters",
        JSON.stringify(rosters)
      );
    });

    it("should return false for invalid input", () => {
      const result = saveRosters("invalid" as any);

      expect(result).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it("should handle localStorage errors", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const rosters: Roster[] = [
        {
          id: "roster-1",
          name: "Test Roster",
          runners: ["John Doe"],
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
      ];

      const result = saveRosters(rosters);

      expect(result).toBe(false);
    });
  });

  describe("createRoster", () => {
    it("should create a roster with valid data", () => {
      const formData: RosterFormData = {
        name: "  Test Roster  ",
        description: "  Test Description  ",
        runners: ["  John Doe  ", "", "  Jane Smith  ", ""],
      };

      const result = createRoster(formData);

      expect(result.name).toBe("Test Roster");
      expect(result.description).toBe("Test Description");
      expect(result.runners).toEqual(["John Doe", "Jane Smith"]);
      expect(result.id).toMatch(/^roster-\d+-[a-z0-9]+$/);
      expect(typeof result.createdAt).toBe("number");
      expect(typeof result.updatedAt).toBe("number");
    });

    it("should handle empty description", () => {
      const formData: RosterFormData = {
        name: "Test Roster",
        runners: ["John Doe"],
      };

      const result = createRoster(formData);

      expect(result.description).toBeUndefined();
    });
  });

  describe("addRoster", () => {
    it("should add a new roster successfully", () => {
      localStorageMock.getItem.mockReturnValue("[]");
      localStorageMock.setItem.mockImplementation(() => {});

      const formData: RosterFormData = {
        name: "New Roster",
        runners: ["John Doe"],
      };

      const result = addRoster(formData);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("New Roster");
    });

    it("should reject duplicate roster names", () => {
      const existingRosters: Roster[] = [
        {
          id: "roster-1",
          name: "Existing Roster",
          runners: ["John Doe"],
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingRosters));

      const formData: RosterFormData = {
        name: "existing roster", // Case insensitive
        runners: ["Jane Smith"],
      };

      const result = addRoster(formData);

      expect(result).toBeNull();
    });
  });

  describe("updateRoster", () => {
    it("should update an existing roster", () => {
      const existingRosters: Roster[] = [
        {
          id: "roster-1",
          name: "Original Name",
          runners: ["John Doe"],
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingRosters));
      localStorageMock.setItem.mockImplementation(() => {});

      const formData: RosterFormData = {
        name: "Updated Name",
        runners: ["John Doe", "Jane Smith"],
      };

      const result = updateRoster("roster-1", formData);

      expect(result).toBe(true);
    });

    it("should return false for non-existent roster", () => {
      localStorageMock.getItem.mockReturnValue("[]");

      const formData: RosterFormData = {
        name: "Updated Name",
        runners: ["John Doe"],
      };

      const result = updateRoster("non-existent", formData);

      expect(result).toBe(false);
    });
  });

  describe("deleteRoster", () => {
    it("should delete an existing roster", () => {
      const existingRosters: Roster[] = [
        {
          id: "roster-1",
          name: "To Delete",
          runners: ["John Doe"],
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
        {
          id: "roster-2",
          name: "To Keep",
          runners: ["Jane Smith"],
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingRosters));
      localStorageMock.setItem.mockImplementation(() => {});

      const result = deleteRoster("roster-1");

      expect(result).toBe(true);
    });

    it("should return false for non-existent roster", () => {
      localStorageMock.getItem.mockReturnValue("[]");

      const result = deleteRoster("non-existent");

      expect(result).toBe(false);
    });
  });

  describe("getRosterById", () => {
    it("should return roster by ID", () => {
      const rosters: Roster[] = [
        {
          id: "roster-1",
          name: "Test Roster",
          runners: ["John Doe"],
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(rosters));

      const result = getRosterById("roster-1");

      expect(result).toEqual(rosters[0]);
    });

    it("should return null for non-existent roster", () => {
      localStorageMock.getItem.mockReturnValue("[]");

      const result = getRosterById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("clearRosters", () => {
    it("should clear all rosters from localStorage", () => {
      clearRosters();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "cross-country-timer-rosters"
      );
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("Failed to remove");
      });

      expect(() => clearRosters()).not.toThrow();
    });
  });
});
