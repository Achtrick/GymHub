import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import styles from "./SwipeableTabs.module.scss";

interface Tab {
  id: string;
  label: string;
  icon: ReactNode;
}

interface SwipeableTabsProps {
  tabs: Tab[];
  activeIndex: number;
  onChange: (index: number) => void;
  children: ReactNode[];
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  locked: "x" | "y" | null;
}

const SWIPE_THRESHOLD_RATIO = 0.2;

function SwipeableTabs({ tabs, activeIndex, onChange, children }: SwipeableTabsProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DragState | null>(null);
  const [dragPx, setDragPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateWidth = () => setWidth(el.getBoundingClientRect().width);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      locked: null,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = dragState.current;
    if (!state) return;

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;

    if (state.locked === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        state.locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (state.locked === "x") {
          event.currentTarget.setPointerCapture(state.pointerId);
          setIsDragging(true);
        }
      }
    }

    if (state.locked === "x") {
      event.preventDefault();
      const atStart = activeIndex === 0 && dx > 0;
      const atEnd = activeIndex === tabs.length - 1 && dx < 0;
      setDragPx(atStart || atEnd ? dx / 3 : dx);
    }
  };

  const endDrag = () => {
    const state = dragState.current;
    if (!state) return;

    if (state.locked === "x") {
      const threshold = width * SWIPE_THRESHOLD_RATIO;
      if (dragPx <= -threshold && activeIndex < tabs.length - 1) {
        onChange(activeIndex + 1);
      } else if (dragPx >= threshold && activeIndex > 0) {
        onChange(activeIndex - 1);
      }
    }

    dragState.current = null;
    setIsDragging(false);
    setDragPx(0);
  };

  const offset = -activeIndex * width + dragPx;

  return (
    <div className={styles.wrapper}>
      <div
        ref={viewportRef}
        className={styles.viewport}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className={styles.track}
          style={{
            transform: `translateX(${offset}px)`,
            transition: isDragging
              ? "none"
              : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {children.map((child, index) => (
            <div className={styles.panel} data-swipe-panel key={tabs[index].id}>
              {child}
            </div>
          ))}
        </div>
      </div>

      <nav className={styles.tabBar}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            className={index === activeIndex ? styles.tabActive : styles.tab}
            onClick={() => onChange(index)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default SwipeableTabs;
