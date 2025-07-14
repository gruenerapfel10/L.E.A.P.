import { useState, useEffect, useCallback } from 'react';

export interface TextSelection {
  text: string;
  range: Range | null;
  rect: DOMRect | null;
}

export interface ContextMenuOptions {
  x: number;
  y: number;
  selectedText: string;
}

export function useTextSelection() {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuOptions | null>(null);

  const getSelectedText = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const text = range.toString().trim();
    
    if (text.length === 0) return null;

    const rect = range.getBoundingClientRect();
    
    return {
      text,
      range,
      rect
    };
  }, []);

  const handleTextSelection = useCallback(() => {
    const selectedText = getSelectedText();
    setSelection(selectedText);
  }, [getSelectedText]);

  const handleContextMenu = useCallback((event: MouseEvent) => {
    const selectedText = getSelectedText();
    
    if (selectedText && selectedText.text.length > 0) {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        selectedText: selectedText.text
      });
    } else {
      setContextMenu(null);
    }
  }, [getSelectedText]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
    const windowSelection = window.getSelection();
    if (windowSelection) {
      windowSelection.removeAllRanges();
    }
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      // Only close context menu if clicking outside the context menu
      if (contextMenu) {
        const target = event.target as Element;
        const contextMenuElement = document.querySelector('[data-context-menu="true"]');
        
        // Check if the click is outside the context menu
        if (contextMenuElement && !contextMenuElement.contains(target)) {
          setContextMenu(null);
        }
      }
    };

    const handleSelectionChange = () => {
      handleTextSelection();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleTextSelection, handleContextMenu, contextMenu]);

  return {
    selection,
    contextMenu,
    closeContextMenu,
    clearSelection
  };
} 