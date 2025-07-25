import { useEffect } from "react";
import { createPortal } from "react-dom";
import css from "./Modal.module.css";
import type { ReactNode } from "react";

interface ModalProps {
  children: ReactNode;
  closeWindow: () => void;
}

export default function Modal({ children, closeWindow }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeWindow();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = ""; 
    };
  }, [closeWindow]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeWindow();
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return createPortal(
    <div
      className={css.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className={css.modal} onClick={handleContentClick}>
        {children}
      </div>
    </div>,
    document.body
  );
}
