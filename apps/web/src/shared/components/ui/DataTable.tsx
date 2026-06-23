"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  render?: (item: T) => React.ReactNode;
  style?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
}

export interface FilterOption<T> {
  label: string;
  key: keyof T | ((item: T) => any);
  options: { label: string; value: any }[];
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[]; // Can support nested keys if string representation
  filterOptions?: FilterOption<T>[];
  itemsPerPage?: number;
  emptyMessage?: string;
  loading?: boolean;
  externalPagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalEntries?: number;
  };
}

export default function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchKeys = [],
  filterOptions = [],
  itemsPerPage = 10,
  emptyMessage = "No entries found.",
  loading = false,
  externalPagination,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);

  const isExternal = !!externalPagination;
  const activePage = isExternal ? externalPagination.currentPage : currentPage;

  // Reset page when search or filter changes
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (isExternal) {
      externalPagination.onPageChange(1);
    } else {
      setCurrentPage(1);
    }
  };

  const handleFilterChange = (filterLabel: string, val: any) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterLabel]: val === "" ? undefined : val,
    }));
    if (isExternal) {
      externalPagination.onPageChange(1);
    } else {
      setCurrentPage(1);
    }
  };

  // Filter and search logic
  const filteredData = useMemo(() => {
    return data.filter((item: any) => {
      // 1. Check dropdown filters
      for (const filter of filterOptions) {
        const filterVal = selectedFilters[filter.label];
        if (filterVal !== undefined) {
          const itemValue =
            typeof filter.key === "function"
              ? filter.key(item)
              : item[filter.key];
          if (itemValue !== filterVal) {
            return false;
          }
        }
      }

      // 2. Check search term
      if (searchTerm.trim() !== "" && searchKeys.length > 0) {
        const match = searchKeys.some((key) => {
          const itemValue = typeof key === "string" && key.includes(".") 
            ? key.split(".").reduce((acc, curr) => acc?.[curr], item)
            : item[key as string];

          return (
            itemValue &&
            String(itemValue)
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          );
        });
        if (!match) return false;
      }

      return true;
    });
  }, [data, searchTerm, selectedFilters, searchKeys, filterOptions]);

  // Pagination calculation
  const totalPagesCount = isExternal ? externalPagination.totalPages : Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    if (isExternal) return data; // Data is already paginated by server
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage, isExternal, data]);

  const totalLength = isExternal ? (externalPagination.totalEntries ?? data.length * totalPagesCount) : filteredData.length;

  const startEntry = isExternal
    ? (totalLength === 0 ? 0 : (activePage - 1) * itemsPerPage + 1)
    : (filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1);

  const endEntry = isExternal
    ? Math.min(totalLength, activePage * itemsPerPage)
    : Math.min(filteredData.length, currentPage * itemsPerPage);

  const handlePageClick = (page: number) => {
    if (isExternal) {
      externalPagination.onPageChange(page);
    } else {
      setCurrentPage(page);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* ── Filter & Search Control Bar ──────────────────────────────────────── */}
      {(searchKeys.length > 0 || filterOptions.length > 0) && (
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          background: "rgba(10, 25, 47, 0.2)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {filterOptions.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-muted)", fontSize: "13px" }}>
                <SlidersHorizontal size={14} color="var(--color-accent)" />
                <span style={{ fontWeight: 500 }}>Filter by:</span>
              </div>
            )}
            
            {filterOptions.map((filter) => (
              <div key={filter.label} style={{ position: "relative" }}>
                <select
                  value={selectedFilters[filter.label] ?? ""}
                  onChange={(e) => handleFilterChange(filter.label, e.target.value)}
                  style={{
                    padding: "7px 28px 7px 12px",
                    background: "rgba(10, 25, 47, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "13px",
                    color: "var(--color-text-primary)",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                    transition: "border-color var(--transition-fast)",
                  }}
                  className="glass-select"
                >
                  <option value="" style={{ background: "#0a192f" }}>All {filter.label}s</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ background: "#0a192f" }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {/* Arrow indicator */}
                <div style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderTop: "5px solid var(--color-text-muted)",
                }} />
              </div>
            ))}
          </div>

          {searchKeys.length > 0 && (
            <div style={{ position: "relative" }}>
              <Search size={14} style={{
                position: "absolute",
                left: "11px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted)",
              }} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{
                  width: "240px",
                  padding: "7px 12px 7px 32px",
                  background: "rgba(10, 25, 47, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "13px",
                  color: "var(--color-text-primary)",
                  outline: "none",
                  transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
                }}
                className="glass-input"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Table Container ─────────────────────────────────────────────────── */}
      <div style={{ overflowX: "auto", width: "100%" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
              {columns.map((col, index) => (
                <th
                  key={index}
                  style={{
                    padding: "12px 20px",
                    textAlign: "left",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    background: "rgba(10, 25, 47, 0.3)",
                    fontFamily: "var(--font-heading)",
                    ...col.headerStyle,
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: "48px", textAlign: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.1)",
                      borderTopColor: "var(--color-accent)",
                      animation: "datatable-spin 0.7s linear infinite",
                    }} />
                    <style>{`
                      @keyframes datatable-spin {
                        to { transform: rotate(360deg); }
                      }
                    `}</style>
                    <span style={{ fontSize: "13.5px", color: "var(--color-text-secondary)" }}>Loading logs...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{
                  padding: "48px",
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  fontSize: "13.5px",
                }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rIndex) => (
                <tr
                  key={rIndex}
                  style={{
                    borderBottom: rIndex < paginatedData.length - 1 ? "1px solid rgba(255, 255, 255, 0.04)" : "none",
                    transition: "background-color var(--transition-fast)",
                  }}
                  className="table-row-hover"
                >
                  {columns.map((col, cIndex) => (
                    <td
                      key={cIndex}
                      style={{
                        padding: "12px 20px",
                        fontSize: "13.5px",
                        color: "var(--color-text-secondary)",
                        ...col.style,
                      }}
                    >
                      {col.render
                        ? col.render(item)
                        : col.accessorKey
                          ? String(item[col.accessorKey] ?? "")
                          : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination Footer ───────────────────────────────────────────────── */}
      {!loading && totalLength > 0 && (
        <div style={{
          padding: "14px 20px",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(10, 25, 47, 0.1)",
          flexWrap: "wrap",
          gap: "12px",
        }}>
          {/* Entries summary */}
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
            Showing <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{startEntry}</span> to{" "}
            <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{endEntry}</span> of{" "}
            <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{totalLength}</span> entries
          </div>

          {/* Navigation controls */}
          {totalPagesCount > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={() => handlePageClick(Math.max(1, activePage - 1))}
                disabled={activePage === 1}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--radius-md)",
                  background: activePage === 1 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  color: activePage === 1 ? "var(--color-text-muted)" : "var(--color-text-primary)",
                  cursor: activePage === 1 ? "not-allowed" : "pointer",
                  transition: "background var(--transition-fast)",
                }}
                className={activePage !== 1 ? "btn-glow" : ""}
                title="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPagesCount }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = pageNum === activePage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageClick(pageNum)}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "var(--radius-md)",
                      fontSize: "13px",
                      fontWeight: isCurrent ? 600 : 400,
                      background: isCurrent
                        ? "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))"
                        : "rgba(255,255,255,0.05)",
                      border: isCurrent
                        ? "1px solid rgba(255,255,255,0.15)"
                        : "1px solid rgba(255,255,255,0.05)",
                      color: isCurrent ? "var(--color-accent-text)" : "var(--color-text-primary)",
                      cursor: "pointer",
                      boxShadow: isCurrent ? "0 0 8px rgba(245, 158, 11, 0.3)" : "none",
                      transition: "background var(--transition-fast), color var(--transition-fast)",
                    }}
                    className={!isCurrent ? "btn-glow" : ""}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageClick(Math.min(totalPagesCount, activePage + 1))}
                disabled={activePage === totalPagesCount}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "var(--radius-md)",
                  background: activePage === totalPagesCount ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  color: activePage === totalPagesCount ? "var(--color-text-muted)" : "var(--color-text-primary)",
                  cursor: activePage === totalPagesCount ? "not-allowed" : "pointer",
                  transition: "background var(--transition-fast)",
                }}
                className={activePage !== totalPagesCount ? "btn-glow" : ""}
                title="Next Page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
