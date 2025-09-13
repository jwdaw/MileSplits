import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Runner } from "@/types";

/**
 * Format time from milliseconds to MM:SS format
 */
function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Generate and download PDF report of race results
 */
export function exportRaceResultsToPDF(
  runners: Runner[],
  raceTime: number,
  raceDate: Date = new Date()
): void {
  try {
    // Create new PDF document
    const doc = new jsPDF();

    // Set up document properties
    doc.setProperties({
      title: "Cross Country Race Results",
      subject: "Race timing results",
      author: "Cross Country Timer App",
      creator: "Cross Country Timer App",
    });

    // Add title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Cross Country Race Results", 105, 20, { align: "center" });

    // Add race information
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const dateStr = raceDate.toLocaleDateString();
    const timeStr = raceDate.toLocaleTimeString();
    doc.text(`Race Date: ${dateStr}`, 20, 35);
    doc.text(`Race Time: ${timeStr}`, 20, 42);
    doc.text(`Total Race Duration: ${formatTime(raceTime)}`, 20, 49);
    doc.text(`Number of Runners: ${runners.length}`, 20, 56);

    // Prepare table data
    const tableData = runners.map((runner, index) => {
      const mile1 = runner.splits.mile1
        ? formatTime(runner.splits.mile1)
        : "--:--";
      const mile2 = runner.splits.mile2
        ? formatTime(runner.splits.mile2)
        : "--:--";
      const mile3 = runner.splits.mile3
        ? formatTime(runner.splits.mile3)
        : "--:--";

      // Calculate split differences
      const split1to2 =
        runner.splits.mile1 && runner.splits.mile2
          ? formatTime(runner.splits.mile2 - runner.splits.mile1)
          : "--:--";
      const split2to3 =
        runner.splits.mile2 && runner.splits.mile3
          ? formatTime(runner.splits.mile3 - runner.splits.mile2)
          : "--:--";

      return [
        index + 1,
        runner.name,
        mile1,
        mile2,
        mile3,
        split1to2,
        split2to3,
      ];
    });

    // Add table
    autoTable(doc, {
      startY: 65,
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
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [41, 128, 185], // Blue header
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 }, // #
        1: { halign: "left", cellWidth: 50 }, // Runner Name
        2: { halign: "center", cellWidth: 25 }, // Mile 1
        3: { halign: "center", cellWidth: 25 }, // Mile 2
        4: { halign: "center", cellWidth: 25 }, // Mile 3
        5: { halign: "center", cellWidth: 25 }, // 1→2 Split
        6: { halign: "center", cellWidth: 25 }, // 2→3 Split
      },
    });

    // Add summary statistics if we have data
    if (runners.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 15;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Race Summary", 20, finalY);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Calculate statistics
      const runnersWithMile1 = runners.filter((r) => r.splits.mile1).length;
      const runnersWithMile2 = runners.filter((r) => r.splits.mile2).length;
      const runnersWithMile3 = runners.filter((r) => r.splits.mile3).length;

      doc.text(
        `Runners with Mile 1 splits: ${runnersWithMile1}/${runners.length}`,
        20,
        finalY + 10
      );
      doc.text(
        `Runners with Mile 2 splits: ${runnersWithMile2}/${runners.length}`,
        20,
        finalY + 17
      );
      doc.text(
        `Runners with Mile 3 splits: ${runnersWithMile3}/${runners.length}`,
        20,
        finalY + 24
      );

      // Add fastest splits if available
      if (runnersWithMile1 > 0) {
        const fastestMile1 = Math.min(
          ...runners.filter((r) => r.splits.mile1).map((r) => r.splits.mile1!)
        );
        const fastestMile1Runner = runners.find(
          (r) => r.splits.mile1 === fastestMile1
        );
        doc.text(
          `Fastest Mile 1: ${formatTime(fastestMile1)} (${
            fastestMile1Runner?.name
          })`,
          20,
          finalY + 31
        );
      }
    }

    // Add footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Generated by Cross Country Timer App", 105, pageHeight - 10, {
      align: "center",
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const filename = `race-results-${timestamp}.pdf`;

    // Save the PDF
    doc.save(filename);

    console.log(`PDF exported successfully: ${filename}`);
  } catch (error) {
    console.error("Failed to export PDF:", error);
    throw new Error("Failed to generate PDF report");
  }
}

/**
 * Check if PDF export is supported in current browser
 */
export function isPDFExportSupported(): boolean {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return false;
    }

    // Check if required APIs are available
    return !!(window.Blob && window.URL && window.URL.createObjectURL);
  } catch {
    return false;
  }
}
