import type { MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "../Icons";
import styles from "./Modal.module.scss";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  const stop = (event: MouseEvent) => event.stopPropagation();

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={stop}>
        <div className={styles.header}>
          <h2>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
