// import { useEffect, useRef } from "react";
// import { createPortal } from "react-dom";

// interface ModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   children: React.ReactNode;
//   className?: string;
//   showCloseButton?: boolean;
//   isFullscreen?: boolean;
// }

// export const Modal: React.FC<ModalProps> = ({
//   isOpen,
//   onClose,
//   children,
//   className = "",
//   showCloseButton = true,
//   isFullscreen = false,
// }) => {
//   const modalRef = useRef<HTMLDivElement>(null);

//   /* 🔑 Close on ESC */
//   useEffect(() => {
//     if (!isOpen) return;

//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.key === "Escape") {
//         onClose();
//       }
//     };

//     document.addEventListener("keydown", handleKeyDown);
//     return () => document.removeEventListener("keydown", handleKeyDown);
//   }, [isOpen, onClose]);

//   /* 🔒 Lock body scroll */
//   useEffect(() => {
//     if (!isOpen) return;

//     const originalStyle = window.getComputedStyle(document.body).overflow;
//     document.body.style.overflow = "hidden";

//     return () => {
//       document.body.style.overflow = originalStyle;
//     };
//   }, [isOpen]);

//   if (!isOpen) return null;

//   return createPortal(
//     <div className="fixed inset-0 z-[9999] flex items-center justify-center">
//       {/* Overlay */}
//       {!isFullscreen && (
//         <div
//           className="absolute inset-0 bg-gray-400/50 backdrop-blur-[32px]"
//           onClick={onClose}
//         />
//       )}

//       {/* Modal Container */}
//       <div
//         ref={modalRef}
//         role="dialog"
//         aria-modal="true"
//         className={`
//           relative z-[10000] w-full max-h-[90vh] overflow-auto
//           rounded-3xl bg-white shadow-xl dark:bg-gray-900
//           ${isFullscreen ? "h-full w-full rounded-none" : ""}
//           ${className}
//         `}
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Close Button */}
//         {showCloseButton && (
//           <button
//             aria-label="Close modal"
//             onClick={onClose}
//             className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center
//               rounded-full bg-gray-100 text-gray-500 transition
//               hover:bg-gray-200 hover:text-gray-700
//               dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
//           >
//             ✕
//           </button>
//         )}

//         {/* Modal Content */}
//         <div className="p-6">{children}</div>
//       </div>
//     </div>,
//     document.body
//   );
// };

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  isFullscreen?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  showCloseButton = true,
  isFullscreen = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = originalStyle; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      {!isFullscreen && (
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className={`
          relative z-[10000] w-full max-h-[90vh] overflow-auto
          rounded-2xl bg-white shadow-2xl dark:bg-gray-900
          ${isFullscreen ? "h-full w-full rounded-none" : ""}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center
              rounded-full bg-white/20 text-white transition hover:bg-white/30"
          >
            ✕
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};
 