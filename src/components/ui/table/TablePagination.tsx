import React from "react";
// import "./tablePagination.css";
import "./tablePagination.css"

export interface TablePaginationProps {
  totalItems: number;
  rowsPerPage: number;
  currentPage: number;          // 1-based index
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (size: number) => void;
  rowsPerPageOptions?: number[];
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  totalItems,
  rowsPerPage,
  currentPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25, 50],
  className = "",
}) => {
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalItems);

  

  // if (totalPages <= 1) return null;

  return (
    <div className={`table-pagination ${className} dark:bg-gray-900 dark:text-gray-400`}>
      {/* Rows per page */}
      {onRowsPerPageChange && (
        <div className="rows-per-page">
          <span>Rows per page:</span>
          <select
          className="dark:bg-gray-900 "
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          >
            {rowsPerPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Range info */}
      <span className="range">
        {start}–{end} of {totalItems}
      </span>

      {/* Controls */}
      <div className="controls">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          ‹
        </button>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={totalItems <= 0 ||currentPage === totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
};

// export default TablePagination;
