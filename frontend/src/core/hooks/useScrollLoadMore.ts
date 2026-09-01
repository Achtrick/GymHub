import { useEffect, type RefObject } from "react";

const THRESHOLD = 0.8;

// Walks up from the anchor to the nearest ancestor that actually scrolls
// (overflow-y: auto/scroll) — the SwipeableTabs panel on tabbed pages, the
// UserLayout `.content` region on plain pages, or nothing at all (falls back
// to window) on layouts like AdminLayout where the whole page scrolls.
function findScrollContainer(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node && node !== document.body && node !== document.documentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

// Calls onReachThreshold when the scroll container has been scrolled 80% of
// the way down — or immediately if the content is too short to scroll at
// all, so a thin first page keeps auto-filling.
export function useScrollLoadMore(
  anchorRef: RefObject<HTMLElement | null>,
  onReachThreshold: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;

    const container = findScrollContainer(anchorRef.current);
    const target: HTMLElement | Window = container ?? window;

    const handleScroll = () => {
      const scrollTop = container ? container.scrollTop : window.scrollY;
      const scrollHeight = container ? container.scrollHeight : document.documentElement.scrollHeight;
      const clientHeight = container ? container.clientHeight : window.innerHeight;

      if (scrollHeight <= clientHeight) {
        onReachThreshold();
        return;
      }

      if ((scrollTop + clientHeight) / scrollHeight >= THRESHOLD) {
        onReachThreshold();
      }
    };

    target.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => target.removeEventListener("scroll", handleScroll);
  }, [anchorRef, onReachThreshold, enabled]);
}
