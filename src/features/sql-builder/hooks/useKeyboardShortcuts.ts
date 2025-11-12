import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onShare?: () => void;
  onReset?: () => void;
  onExport?: () => void;
  onSave?: () => void;
}

export function useKeyboardShortcuts({ onShare, onReset, onExport, onSave }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return; // Let user type normally
      }

      // Check for modifier keys (Ctrl/Cmd)
      const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      // Prevent default for our shortcuts
      if (modifier) {
        switch (event.key.toLowerCase()) {
          case 's':
            // Ctrl/Cmd + S: Share query
            if (onShare) {
              event.preventDefault();
              onShare();
            }
            break;
          
          case 'h':
            // Ctrl/Cmd + H: Save to history
            if (onSave) {
              event.preventDefault();
              onSave();
            }
            break;
          
          case 'r':
            // Ctrl/Cmd + R: Reset (only if not browser refresh)
            if (event.shiftKey && onReset) {
              event.preventDefault();
              onReset();
            }
            break;
          
          case 'e':
            // Ctrl/Cmd + E: Export
            if (onExport) {
              event.preventDefault();
              onExport();
            }
            break;
        }
      }

      // Escape key: Clear focus (accessibility)
      if (event.key === 'Escape') {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };

    // Add event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [onShare, onReset, onExport, onSave]);
}

