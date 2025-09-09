import { render, screen } from "@testing-library/react";
import { Stopwatch } from "../Stopwatch";
import { SplitButton } from "../SplitButton";
import AddRunner from "../AddRunner";

describe("Mobile Optimization Tests", () => {
  describe("Touch Target Sizes", () => {
    test("Stopwatch button meets minimum touch target size", () => {
      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={() => {}}
          onStop={() => {}}
        />
      );

      const button = screen.getByRole("button", { name: /start timer/i });
      const styles = window.getComputedStyle(button);

      // Button should be at least 44px (minimum touch target)
      expect(button).toHaveClass("w-28", "h-28"); // 112px on mobile
    });

    test("SplitButton meets minimum touch target size", () => {
      render(
        <SplitButton
          runnerId="test-runner"
          splitType="mile1"
          elapsedTime={60000}
          isTimerRunning={true}
          onSplitRecord={() => {}}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("min-h-[48px]", "min-w-[48px]");
    });

    test("AddRunner button meets minimum touch target size", () => {
      render(<AddRunner runners={[]} onAddRunner={() => {}} />);

      const button = screen.getByRole("button", { name: /add runner/i });
      expect(button).toHaveStyle({ minHeight: "48px" });
    });

    test("AddRunner input meets minimum touch target size and prevents zoom", () => {
      render(<AddRunner runners={[]} onAddRunner={() => {}} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveStyle({
        minHeight: "48px",
        fontSize: "16px", // Prevents zoom on iOS
      });
    });
  });

  describe("Mobile-Friendly Classes", () => {
    test("Components use touch-target class", () => {
      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={() => {}}
          onStop={() => {}}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("touch-target");
    });

    test("SplitButton uses responsive sizing", () => {
      render(
        <SplitButton
          runnerId="test-runner"
          splitType="mile1"
          elapsedTime={60000}
          isTimerRunning={true}
          onSplitRecord={() => {}}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-full");
    });
  });

  describe("Responsive Text Sizing", () => {
    test("Stopwatch uses responsive text sizing", () => {
      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={() => {}}
          onStop={() => {}}
        />
      );

      const timeDisplay = screen.getByText("00:00");
      expect(timeDisplay).toHaveClass("text-4xl", "sm:text-6xl");
    });
  });
});
