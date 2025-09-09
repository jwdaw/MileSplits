import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AddRunner from "../AddRunner";
import { Runner } from "@/types";

describe("AddRunner", () => {
  const mockOnAddRunner = vi.fn();
  const existingRunners: Runner[] = [
    {
      id: "1",
      name: "John Doe",
      splits: {},
    },
  ];

  beforeEach(() => {
    mockOnAddRunner.mockClear();
  });

  it("renders input field and add button", () => {
    render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

    expect(screen.getByLabelText("Add Runner")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter runner name")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Runner" })
    ).toBeInTheDocument();
  });

  it("adds a new runner with valid name", async () => {
    render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

    const input = screen.getByPlaceholderText("Enter runner name");
    const button = screen.getByRole("button", { name: "Add Runner" });

    fireEvent.change(input, { target: { value: "Jane Smith" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnAddRunner).toHaveBeenCalledWith({
        id: expect.any(String),
        name: "Jane Smith",
        splits: {},
      });
    });

    expect(input).toHaveValue("");
  });

  it("shows error for empty runner name", async () => {
    render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

    const button = screen.getByRole("button", { name: "Add Runner" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("Runner name cannot be empty")
      ).toBeInTheDocument();
    });

    expect(mockOnAddRunner).not.toHaveBeenCalled();
  });

  it("shows error for duplicate runner name", async () => {
    render(
      <AddRunner runners={existingRunners} onAddRunner={mockOnAddRunner} />
    );

    const input = screen.getByPlaceholderText("Enter runner name");
    const button = screen.getByRole("button", { name: "Add Runner" });

    fireEvent.change(input, { target: { value: "John Doe" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("Runner name already exists")
      ).toBeInTheDocument();
    });

    expect(mockOnAddRunner).not.toHaveBeenCalled();
  });

  it("shows error for duplicate runner name (case insensitive)", async () => {
    render(
      <AddRunner runners={existingRunners} onAddRunner={mockOnAddRunner} />
    );

    const input = screen.getByPlaceholderText("Enter runner name");
    const button = screen.getByRole("button", { name: "Add Runner" });

    fireEvent.change(input, { target: { value: "JOHN DOE" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("Runner name already exists")
      ).toBeInTheDocument();
    });

    expect(mockOnAddRunner).not.toHaveBeenCalled();
  });

  it("clears error when user starts typing", async () => {
    render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

    const input = screen.getByPlaceholderText("Enter runner name");
    const button = screen.getByRole("button", { name: "Add Runner" });

    // Trigger error first
    fireEvent.click(button);
    await waitFor(() => {
      expect(
        screen.getByText("Runner name cannot be empty")
      ).toBeInTheDocument();
    });

    // Start typing to clear error
    fireEvent.change(input, { target: { value: "J" } });
    expect(
      screen.queryByText("Runner name cannot be empty")
    ).not.toBeInTheDocument();
  });

  it("displays existing runners count and names", () => {
    render(
      <AddRunner runners={existingRunners} onAddRunner={mockOnAddRunner} />
    );

    expect(screen.getByText("1 runner added")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("trims whitespace from runner names", async () => {
    render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

    const input = screen.getByPlaceholderText("Enter runner name");
    const button = screen.getByRole("button", { name: "Add Runner" });

    fireEvent.change(input, { target: { value: "  Jane Smith  " } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnAddRunner).toHaveBeenCalledWith({
        id: expect.any(String),
        name: "Jane Smith",
        splits: {},
      });
    });
  });

  it("generates unique IDs for runners", async () => {
    render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

    const input = screen.getByPlaceholderText("Enter runner name");
    const button = screen.getByRole("button", { name: "Add Runner" });

    // Add first runner
    fireEvent.change(input, { target: { value: "Runner 1" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnAddRunner).toHaveBeenCalledWith({
        id: expect.any(String),
        name: "Runner 1",
        splits: {},
      });
    });

    const firstCallId = mockOnAddRunner.mock.calls[0][0].id;

    // Add second runner
    fireEvent.change(input, { target: { value: "Runner 2" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnAddRunner).toHaveBeenCalledWith({
        id: expect.any(String),
        name: "Runner 2",
        splits: {},
      });
    });

    const secondCallId = mockOnAddRunner.mock.calls[1][0].id;

    expect(firstCallId).not.toBe(secondCallId);
  });
});
