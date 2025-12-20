import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * ポップオーバーの開閉と外側クリック検知を管理する汎用フック
 */
export function usePopoverControl() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const togglePopover = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closePopover = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 外側クリックでポップオーバーを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return {
    isOpen,
    containerRef,
    togglePopover,
    closePopover,
  };
}
