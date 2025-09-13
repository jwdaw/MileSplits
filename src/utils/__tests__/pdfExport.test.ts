import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportRaceResultsToPDF, isPDFExportSupported } from "../pdfExport";
import { Runner } from "@/types";

// Mock jsPDF and autoTable
vi.mock("jspdf", () => {
  const mockDoc = {
    setProperties: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    save: vi.fn(),
    internal: {
      pageSize: {
        height: 297,
      },
    },
    lastAutoTable: {
      finalY: 100,
    },
  };

  return {
    default: vi.fn(() => mockDoc),
  };
});

vi.mock("jspdf-autotable", () => ({
  default: vi.fn(),
}));

// Mock console methods
const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

describe("PDF Export Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("isPDFExportSupported", () => {
    it("should return false in non-browser environment", () => {
      // Mock server environment
      const originalWindow = global.window;
      delete (global as any).window;

      expect(isPDFExportSupported()).toBe(false);

      global.window = originalWindow;
    });

    it("should return true when required APIs are available", () => {
      // Mock browser environment with required APIs
      Object.defineProperty(global, "window", {
        value: {
          Blob: function () {},
          URL: {
            createObjectURL: vi.fn(),
          },
        },
        writable: true,
      });

      expect(isPDFExportSupported()).toBe(true);
    });

    it("should return false when required APIs are missing", () => {
      Object.defineProperty(global, "window", {
        value: {},
        writable: true,
      });

      expect(isPDFExportSupported()).toBe(false);
    });
  });

  describe("exportRaceResultsToPDF", () => {
    const mockRunners: Runner[] = [
      {
        id: "1",
        name: "John Doe",
        splits: {
          mile1: 360000, // 6:00
          mile2: 720000, // 12:00
          mile3: 1080000, // 18:00
        },
      },
      {
        id: "2",
        name: "Jane Smith",
        splits: {
          mile1: 330000, // 5:30
          mile2: 690000, // 11:30
          // No mile3
        },
      },
      {
        id: "3",
        name: "Bob Wilson",
        splits: {
          // No splits recorded
        },
      },
    ];

    it("should generate PDF with correct document properties", () => {
      const jsPDF = require("jspdf").default;
      const mockDoc = new jsPDF();

      exportRaceResultsToPDF(mockRunners, 1200000); // 20:00 race time

      expect(mockDoc.setProperties).toHaveBeenCalledWith({
        title: "Cross Country Race Results",
        subject: "Race timing results",
        author: "Cross Country Timer App",
        creator: "Cross Country Timer App",
      });
    });

    it("should add race information to PDF", () => {
      const jsPDF = require("jspdf").default;
      const mockDoc = new jsPDF();
      const testDate = new Date("2024-01-15T10:30:00");

      exportRaceResultsToPDF(mockRunners, 1200000, testDate);

      expect(mockDoc.text).toHaveBeenCalledWith(
        "Cross Country Race Results",
        105,
        20,
        { align: "center" }
      );
      expect(mockDoc.text).toHaveBeenCalledWith("Race Date: 1/15/2024", 20, 35);
      expect(mockDoc.text).toHaveBeenCalledWith(
        "Total Race Duration: 20:00",
        20,
        49
      );
      expect(mockDoc.text).toHaveBeenCalledWith("Number of Runners: 3", 20, 56);
    });

    it("should create table with runner data", () => {
      const autoTable = require("jspdf-autotable").default;

      exportRaceResultsToPDF(mockRunners, 1200000);

      expect(autoTable).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          head: [
            [
              "#",
              "Runner Name",
              "Mile 1",
              "Mile 2",
              "Mile 3",
              "1→2 Split",
              "2→3 Split",
            ],
          ],
          body: [
            [1, "John Doe", "06:00", "12:00", "18:00", "06:00", "06:00"],
            [2, "Jane Smith", "05:30", "11:30", "--:--", "06:00", "--:--"],
            [3, "Bob Wilson", "--:--", "--:--", "--:--", "--:--", "--:--"],
          ],
        })
      );
    });

    it("should save PDF with timestamped filename", () => {
      const jsPDF = require("jspdf").default;
      const mockDoc = new jsPDF();

      exportRaceResultsToPDF(mockRunners, 1200000);

      expect(mockDoc.save).toHaveBeenCalledWith(
        expect.stringMatching(
          /^race-results-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.pdf$/
        )
      );
    });

    it("should log success message", () => {
      exportRaceResultsToPDF(mockRunners, 1200000);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /^PDF exported successfully: race-results-.*\.pdf$/
        )
      );
    });

    it("should handle empty runners array", () => {
      expect(() => {
        exportRaceResultsToPDF([], 0);
      }).not.toThrow();
    });

    it("should handle PDF generation errors", () => {
      const jsPDF = require("jspdf").default;
      const mockDoc = new jsPDF();
      mockDoc.save.mockImplementation(() => {
        throw new Error("Save failed");
      });

      expect(() => {
        exportRaceResultsToPDF(mockRunners, 1200000);
      }).toThrow("Failed to generate PDF report");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to export PDF:",
        expect.any(Error)
      );
    });

    it("should include race summary statistics", () => {
      const jsPDF = require("jspdf").default;
      const mockDoc = new jsPDF();

      exportRaceResultsToPDF(mockRunners, 1200000);

      expect(mockDoc.text).toHaveBeenCalledWith(
        "Race Summary",
        20,
        expect.any(Number)
      );
      expect(mockDoc.text).toHaveBeenCalledWith(
        "Runners with Mile 1 splits: 2/3",
        20,
        expect.any(Number)
      );
      expect(mockDoc.text).toHaveBeenCalledWith(
        "Runners with Mile 2 splits: 2/3",
        20,
        expect.any(Number)
      );
      expect(mockDoc.text).toHaveBeenCalledWith(
        "Runners with Mile 3 splits: 1/3",
        20,
        expect.any(Number)
      );
      expect(mockDoc.text).toHaveBeenCalledWith(
        "Fastest Mile 1: 05:30 (Jane Smith)",
        20,
        expect.any(Number)
      );
    });

    it("should format split times correctly", () => {
      const runnersWithVariousTimes: Runner[] = [
        {
          id: "1",
          name: "Fast Runner",
          splits: {
            mile1: 65000, // 1:05
            mile2: 125000, // 2:05
            mile3: 185000, // 3:05
          },
        },
      ];

      const autoTable = require("jspdf-autotable").default;

      exportRaceResultsToPDF(runnersWithVariousTimes, 300000);

      expect(autoTable).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: [
            [1, "Fast Runner", "01:05", "02:05", "03:05", "01:00", "01:00"],
          ],
        })
      );
    });
  });
});
