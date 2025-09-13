import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExportButton } from "../ExportButton";
import { Runner } from "@/types";

// Mock the PDF export utilities
vi.mock("@/utils/pdfExport", () => ({
  exportRaceResultsToPDF: vi.fn(),
  isPDFExportSupported: vi.fn(() => true),
}));

describe("ExportButton", () => {
  const mockRunners: Runner[] = [
    {
      id: "1",
      name: "John Doe",
      splits: {
        mile1: 360000, // 6:00
        mile2: 720000, // 12:00
      },
    },
    {
      id: "2",
      name: "Jane Smith",
      splits: {
        mile1: 330000, // 5:30
      },
    },
  ];

  const defaultProps = {
    runners: mockRunners,
    elapsedTime: 900000, // 15:00
    isTimerRunning: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders export button with correct text", () => {
      render(<ExportButton {...defaultProps} />);

      expect(screen.getByText("Export Results")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Generate a PDF report with race results and split times"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Export race results to PDF" })
      ).toBeInTheDocument();
    });

    it("shows runner count and race duration", () => {
      render(<ExportButton {...defaultProps} />);

      expect(
        screen.getByText("• 2 runners will be included")
      ).toBeInTheDocument();
      expect(screen.getByText("• Race duration: 15:00")).toBeInTheDocument();
      expect(
        screen.getByText("• Split times and race statistics will be included")
      ).toBeInTheDocument();
    });

    it("handles singular runner count", () => {
      const singleRunnerProps = {
        ...defaultProps,
        runners: [mockRunners[0]],
      };

      render(<ExportButton {...singleRunnerProps} />);

      expect(
        screen.getByText("• 1 runner will be included")
      ).toBeInTheDocument();
    });

    it("shows no splits message when no splits recorded", () => {
      const noSplitsProps = {
        ...defaultProps,
        runners: [
          {
            id: "1",
            name: "No Splits Runner",
            splits: {},
          },
        ],
      };

      render(<ExportButton {...noSplitsProps} />);

      expect(
        screen.getByText("• No split times recorded yet")
      ).toBeInTheDocument();
    });
  });

  describe("Button States", () => {
    it("enables button when runners are present", () => {
      render(<ExportButton {...defaultProps} />);

      const button = screen.getByRole("button", {
        name: "Export race results to PDF",
      });
      expect(button).not.toBeDisabled();
      expect(button).toHaveClass("bg-blue-600");
    });

    it("disables button when no runners", () => {
      const noRunnersProps = {
        ...defaultProps,
        runners: [],
      };

      render(<ExportButton {...noRunnersProps} />);

      const button = screen.getByRole("button", {
        name: "Export race results to PDF",
      });
      expect(button).toBeDisabled();
      expect(button).toHaveClass("bg-gray-300");
      expect(
        screen.getByText("• Add runners to enable PDF export")
      ).toBeInTheDocument();
    });

    it("shows loading state during export", async () => {
      const { exportRaceResultsToPDF } = await import("@/utils/pdfExport");
      (exportRaceResultsToPDF as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ExportButton {...defaultProps} />);

      const button = screen.getByRole("button", {
        name: "Export race results to PDF",
      });
      fireEvent.click(button);

      expect(screen.getByText("Generating PDF...")).toBeInTheDocument();
      expect(button).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText("Generating PDF...")).not.toBeInTheDocument();
      });
    });
  });

  describe("Export Functionality", () => {
    it("calls export function with correct parameters", async () => {
      const { exportRaceResultsToPDF } = await import("@/utils/pdfExport");

      render(<ExportButton {...defaultProps} />);

      const button = screen.getByRole("button", {
        name: "Export race results to PDF",
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(exportRaceResultsToPDF).toHaveBeenCalledWith(
          mockRunners,
          900000
        );
      });
    });

    it("shows success message after successful export", async () => {
      render(<ExportButton {...defaultProps} />);

      const button = screen.getByRole("button", {
        name: "Export race results to PDF",
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText("PDF exported successfully!")
        ).toBeInTheDocument();
      });

      // Success message should disappear after timeout
      await waitFor(
        () => {
          expect(
            screen.queryByText("PDF exported successfully!")
          ).not.toBeInTheDocument();
        },
        { timeout: 4000 }
      );
    });

    it("shows error message when export fails", async () => {
      const { exportRaceResultsToPDF } = await import("@/utils/pdfExport");
      (exportRaceResultsToPDF as any).mockRejectedValue(
        new Error("Export failed")
      );

      render(<ExportButton {...defaultProps} />);

      const button = screen.getByRole("button", {
        name: "Export race results to PDF",
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to export PDF. Please try again.")
        ).toBeInTheDocument();
      });
    });

    it("shows error when no runners to export", async () => {
      const noRunnersProps = {
        ...defaultProps,
        runners: [],
      };

      render(<ExportButton {...noRunnersProps} />);

      const button = screen.getByRole("button", {
        name: "Export race results to PDF",
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("No runners to export")).toBeInTheDocument();
      });
    });

    it("shows error when PDF export not supported", async () => {
      const { isPDFExportSupported } = await import("@/utils/pdfExport");
      (isPDFExportSupported as any).mockReturnValue(false);

      render(<ExportButton {...defaultProps} />);

      const button = screen.getByRole("button", {
        name: "Export race results to PDF",
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText("PDF export not supported in this browser")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Visual Styling", () => {
    it("has proper mobile touch targets", () => {
      render(<ExportButton {...defaultProps} />);

      const button = screen.getByRole("button", {
        name: "Export race results to PDF",
      });
      expect(button).toHaveClass("touch-target");
      expect(button).toHaveStyle("min-height: 48px");
    });

    it("has proper focus styles", () => {
      render(<ExportButton {...defaultProps} />);

      const button = screen.getByRole("button", {
        name: "Export race results to PDF",
      });
      expect(button).toHaveClass("focus:outline-none");
      expect(button).toHaveClass("focus:ring-2");
      expect(button).toHaveClass("focus:ring-offset-2");
    });

    it("has active scale animation", () => {
      render(<ExportButton {...defaultProps} />);

      const button = screen.getByRole("button", {
        name: "Export race results to PDF",
      });
      expect(button).toHaveClass("active:scale-95");
    });

    it("shows download icon in button", () => {
      render(<ExportButton {...defaultProps} />);

      const icon = screen.getByRole("button").querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper aria-label", () => {
      render(<ExportButton {...defaultProps} />);

      const button = screen.getByRole("button", {
        name: "Export race results to PDF",
      });
      expect(button).toHaveAttribute(
        "aria-label",
        "Export race results to PDF"
      );
    });

    it("has proper button type", () => {
      render(<ExportButton {...defaultProps} />);

      const button = screen.getByRole("button", {
        name: "Export race results to PDF",
      });
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("Edge Cases", () => {
    it("handles zero elapsed time", () => {
      const zeroTimeProps = {
        ...defaultProps,
        elapsedTime: 0,
      };

      render(<ExportButton {...zeroTimeProps} />);

      expect(screen.getByText("• Race duration: 0:00")).toBeInTheDocument();
    });

    it("handles large elapsed times", () => {
      const largeTimeProps = {
        ...defaultProps,
        elapsedTime: 3661000, // 61:01
      };

      render(<ExportButton {...largeTimeProps} />);

      expect(screen.getByText("• Race duration: 61:01")).toBeInTheDocument();
    });

    it("clears error messages after timeout", async () => {
      const noRunnersProps = {
        ...defaultProps,
        runners: [],
      };

      render(<ExportButton {...noRunnersProps} />);

      const button = screen.getByRole("button", {
        name: "Export race results to PDF",
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("No runners to export")).toBeInTheDocument();
      });

      await waitFor(
        () => {
          expect(
            screen.queryByText("No runners to export")
          ).not.toBeInTheDocument();
        },
        { timeout: 4000 }
      );
    });
  });
});
