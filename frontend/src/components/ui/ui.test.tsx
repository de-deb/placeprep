import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Badge, Urgency } from "./Badge";
import { EmptyState, ErrorState } from "./States";
import { DataTable } from "./DataTable";

describe("ui primitives", () => {
  it("renders a status badge", () => {
    render(<Badge value="OPEN" />);
    expect(screen.getByText("OPEN")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<EmptyState title="No drives found" hint="Try later" />);
    expect(screen.getByText("No drives found")).toBeInTheDocument();
  });

  it("renders error state with retry", () => {
    render(<ErrorState message="Backend down" onRetry={() => {}} />);
    expect(screen.getByText("Backend down")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("renders urgency labels", () => {
    render(<Urgency level="today" label="Deadline today" />);
    expect(screen.getByText("Deadline today")).toBeInTheDocument();
  });

  it("data table sorts and paginates", () => {
    const rows = [
      { id: "1", name: "Zoe" },
      { id: "2", name: "Aarav" },
    ];
    render(
      <DataTable
        rows={rows}
        pageSize={1}
        columns={[
          { key: "name", header: "Name", render: (r) => r.name, sortValue: (r) => r.name },
        ]}
      />
    );
    // page 1 shows first row unsorted
    expect(screen.getByText("Zoe")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Name"));
    // sorted ascending: Aarav first
    expect(screen.getByText("Aarav")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Next →"));
    expect(screen.getByText("Zoe")).toBeInTheDocument();
  });

  it("data table shows empty state", () => {
    render(<DataTable rows={[]} columns={[]} emptyTitle="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});
