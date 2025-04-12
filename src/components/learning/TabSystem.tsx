import { useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import React from 'react';
import { Allotment, LayoutPriority } from "allotment";
import { useDrag, useDrop, ConnectDragSource, ConnectDropTarget } from 'react-dnd';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import type { XYCoord } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Custom SVG icons with gradient support
const FileQuestionIcon = ({ isActive }: { isActive: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" 
      stroke={isActive ? "url(#fileQuestionGradient1)" : "url(#fileQuestionGradient2)"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M14 2V8H20" 
      stroke={isActive ? "url(#fileQuestionGradient1)" : "url(#fileQuestionGradient2)"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 18V18.01" 
      stroke={isActive ? "url(#fileQuestionGradient1)" : "url(#fileQuestionGradient2)"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 14C12.8284 14 13.5 13.3284 13.5 12.5C13.5 11.6716 12.8284 11 12 11C11.1716 11 10.5 11.6716 10.5 12.5C10.5 13.3284 11.1716 14 12 14Z" 
      stroke={isActive ? "url(#fileQuestionGradient1)" : "url(#fileQuestionGradient2)"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="fileQuestionGradient1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
      <linearGradient id="fileQuestionGradient2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#9CA3AF" />
        <stop offset="100%" stopColor="#6B7280" />
      </linearGradient>
    </defs>
  </svg>
);

const BookOpenIcon = ({ isActive }: { isActive: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z" 
      stroke={isActive ? "url(#bookOpenGradient1)" : "url(#bookOpenGradient2)"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 19.4413 12.8787 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z" 
      stroke={isActive ? "url(#bookOpenGradient1)" : "url(#bookOpenGradient2)"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="bookOpenGradient1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="bookOpenGradient2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#9CA3AF" />
        <stop offset="100%" stopColor="#6B7280" />
      </linearGradient>
    </defs>
  </svg>
);

const BotIcon = ({ isActive }: { isActive: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M12 8V4H8" 
      stroke={isActive ? "url(#botGradient1)" : "url(#botGradient2)"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <rect 
      x="4" 
      y="8" 
      width="16" 
      height="10" 
      rx="2" 
      stroke={isActive ? "url(#botGradient1)" : "url(#botGradient2)"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M8 14H8.01" 
      stroke={isActive ? "url(#botGradient1)" : "url(#botGradient2)"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 14H12.01" 
      stroke={isActive ? "url(#botGradient1)" : "url(#botGradient2)"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M16 14H16.01" 
      stroke={isActive ? "url(#botGradient1)" : "url(#botGradient2)"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="botGradient1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="botGradient2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#9CA3AF" />
        <stop offset="100%" stopColor="#6B7280" />
      </linearGradient>
    </defs>
  </svg>
);

const PercentIcon = ({ isActive }: { isActive: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M19 5L5 19" 
      stroke={isActive ? "url(#percentGradient1)" : "url(#percentGradient2)"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle 
      cx="6.5" 
      cy="6.5" 
      r="2.5" 
      stroke={isActive ? "url(#percentGradient1)" : "url(#percentGradient2)"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle 
      cx="17.5" 
      cy="17.5" 
      r="2.5" 
      stroke={isActive ? "url(#percentGradient1)" : "url(#percentGradient2)"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="percentGradient1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>
      <linearGradient id="percentGradient2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#9CA3AF" />
        <stop offset="100%" stopColor="#6B7280" />
      </linearGradient>
    </defs>
  </svg>
);

// Define Item Type for Drag and Drop
const ItemTypes = {
  TAB: 'tab',
};

// Interface for the data structure of a tab
interface Tab {
  id: string;
  title: string;
  icon?: React.ReactNode;
  iconType?: 'fileQuestion' | 'bookOpen' | 'bot' | 'percent';
}

// Interface for the item being dragged
interface DragItem {
  id: string;
  windowId: string;
  tabData: Tab;
  type: string; // Required by react-dnd
}

// --- New TabItem Component ---
interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  windowId: string; // ID of the window this tab belongs to
  nodeId: string;   // ID of the TabWindow node (needed for context in drop potentially)
  onTabClick: () => void;
  onCloseTab: (e: React.MouseEvent) => void;
}

function TabItem({ tab, isActive, windowId, nodeId, onTabClick, onCloseTab }: TabItemProps) {
  const tabItemRef = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TAB,
    item: { id: tab.id, windowId: windowId, tabData: tab, type: ItemTypes.TAB } as DragItem,
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }), [tab, windowId]);

  drag(tabItemRef);

  const renderIcon = () => {
    switch (tab.iconType) {
      case 'fileQuestion': return <FileQuestionIcon isActive={isActive} />;
      case 'bookOpen': return <BookOpenIcon isActive={isActive} />;
      case 'bot': return <BotIcon isActive={isActive} />;
      case 'percent': return <PercentIcon isActive={isActive} />;
      default: return tab.icon;
    }
  };

  return (
    <div
      ref={tabItemRef}
      className={cn(
        "relative flex items-center flex-shrink-0 cursor-grab",
        "gap-2 rounded-t-md px-3 py-2 transition-all",
        "border-b-2",
        "modern-text-sm",
        isActive
          ? "border-b-primary text-primary bg-gradient-to-br from-primary/15 via-primary/10 to-primary/15 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)]"
          : "border-b-transparent text-muted-foreground hover:text-foreground hover:bg-gradient-to-br hover:from-muted/15 hover:via-muted/10 hover:to-muted/15",
        isDragging ? "opacity-50 cursor-grabbing" : "opacity-100",
        "hover-lift active-scale"
      )}
      onClick={onTabClick}
      style={{ WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', userSelect: 'none' }}
    >
      {tab.iconType && <span className="h-4 w-4 animate-scale-in">{renderIcon()}</span>}
      <span className="font-medium tracking-tight">{tab.title}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 rounded-full hover:bg-muted/20 ml-auto transition-all"
        onClick={(e) => { 
          e.stopPropagation();
          onCloseTab(e);
        }}
        disabled={isDragging}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// --- New Divider Component ---
interface DividerProps {
  index: number; // The insertion index this divider represents
  nodeId: string; // The ID of the TabWindow this divider is in
  isHighlighted: boolean;
  onHover: (index: number | null) => void;
  handleReorder: (item: DragItem, targetNodeId: string, targetIndex: number) => void;
}

function Divider({ index, nodeId, isHighlighted, onHover, handleReorder }: DividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TAB,
    hover: (item: DragItem, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      onHover(index);
    },
    drop: (item: DragItem) => {
        handleReorder(item, nodeId, index);
        onHover(null);
    },
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  }), [index, nodeId, onHover, handleReorder]);

  drop(ref);

  useEffect(() => {
    if (!isOver) {
      onHover(null);
    }
  }, [isOver, onHover]);

  return (
    <div 
      ref={ref}
      className={cn(
        "relative flex-shrink-0 h-6 w-1 mx-1 rounded-full transition-all duration-200", 
        isHighlighted 
          ? "bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
          : "bg-border/40", 
      )}
    />
  );
}

// --- Updated TabWindowProps ---
interface TabWindowProps {
  nodeId: string;
  tabs: Tab[];
  activeTab: string;
  isCollapsed: boolean;
  onTabClick: (nodeId: string, tabId: string) => void;
  onCloseTab: (nodeId: string, tabId: string) => void;
  onToggleCollapse: (nodeId: string) => void;
  parentSplitDirection?: 'horizontal' | 'vertical'; 
  handleDrop: (draggedItem: DragItem, targetNodeId: string, quadrant: Quadrant) => void; // For splits/merges
  globalHoverQuadrant: Quadrant;
  handleReorder: (item: DragItem, targetNodeId: string, targetIndex: number) => void; // Add reorder handler prop
  getContentForTab: (tabId: string) => ReactNode; // Added prop to get content
}

// Quadrant type
type Quadrant = 'top' | 'bottom' | 'left' | 'right' | 'center' | null;

// Define header height constant
const HEADER_HEIGHT = 42; // px

// --- Updated TabWindow Component ---
function TabWindow({ 
  nodeId, 
  tabs, 
  activeTab, 
  isCollapsed, 
  onTabClick, 
  onCloseTab, 
  onToggleCollapse, 
  parentSplitDirection, 
  handleDrop, 
  globalHoverQuadrant, 
  handleReorder, // Get reorder handler
  getContentForTab // Added prop
}: TabWindowProps) {
  const dropRef = useRef<HTMLDivElement>(null);
  const [hoverQuadrant, setHoverQuadrant] = useState<Quadrant>(null);
  const [isOverHeader, setIsOverHeader] = useState(false);
  const [highlightedDividerIndex, setHighlightedDividerIndex] = useState<number | null>(null); 

  // Simplified useDrop for the window itself (handles quadrants and potential merges)
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TAB,
    drop: (item: DragItem, monitor) => {
      const didDrop = monitor.didDrop(); 
      const resetHoverStates = () => {
        setHoverQuadrant(null);
        setIsOverHeader(false);
        setHighlightedDividerIndex(null); 
      };

      if (didDrop || globalHoverQuadrant !== null) {
        // If a nested target handled it (like a Divider) or global edge is active, do nothing here
        resetHoverStates();
        return; 
      }
      
      const effectiveQuadrant = hoverQuadrant ?? 'center';

      // Call handleDrop if a quadrant is active OR if it's a center drop from another window (merge)
      if (effectiveQuadrant !== 'center' || (effectiveQuadrant === 'center' && item.windowId !== nodeId)) {
         console.log(`TabWindow ${nodeId} calling handleDrop. Quadrant: ${effectiveQuadrant}, Source: ${item.windowId}`);
         handleDrop(item, nodeId, effectiveQuadrant);
      } else {
         console.log(`TabWindow ${nodeId} ignoring drop. Quadrant: ${effectiveQuadrant}, Source: ${item.windowId}`);
      }

      resetHoverStates();
    },
    hover(item: DragItem, monitor) {
       if (!dropRef.current) { 
         setHoverQuadrant(null); setIsOverHeader(false); setHighlightedDividerIndex(null);
         return;
      }
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
         setHoverQuadrant(null); setIsOverHeader(false); setHighlightedDividerIndex(null);
         return;
      }
      const hoverBoundingRect = dropRef.current.getBoundingClientRect();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const newIsOverHeader = hoverClientY < HEADER_HEIGHT;

      // Priority 1: Global Edge
      if (globalHoverQuadrant !== null) {
         setHoverQuadrant(null); setIsOverHeader(false); setHighlightedDividerIndex(null);
         return;
      }

      // Priority 2: Header Area
      if (newIsOverHeader) {
        if (!isOverHeader) setIsOverHeader(true);
        // When over header, quadrant logic is paused, and divider logic takes over (handled by Divider component hover)
        if (hoverQuadrant !== null) setHoverQuadrant(null); 
        return; 
      } else if (isOverHeader) {
         // Moved out of header
         setIsOverHeader(false); 
      }
      
      // Priority 3: Window Quadrants (Split/Merge) - Calculate if NOT over header
      // REMOVED: item.windowId !== nodeId check - Allow quadrant detection within the same window
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;
      const thresholdY = hoverBoundingRect.height * 0.3;
      const thresholdX = hoverBoundingRect.width * 0.3;
      let newQuadrant: Quadrant = 'center';
      if (hoverClientY < thresholdY) newQuadrant = 'top';
      else if (hoverClientY > hoverBoundingRect.height - thresholdY) newQuadrant = 'bottom';
      else if (hoverClientX < thresholdX) newQuadrant = 'left';
      else if (hoverClientX > hoverBoundingRect.width - thresholdX) newQuadrant = 'right';

      if (newQuadrant !== hoverQuadrant) {
          setHoverQuadrant(newQuadrant);
          if(newQuadrant !== 'center') {
             // Clear divider highlight if a quadrant becomes active
             setHighlightedDividerIndex(null); 
          }
      }
    },
    collect: (monitor) => ({ 
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(), 
    }),
    // Dependencies updated: removed setLayout, added relevant state
  }), [nodeId, handleDrop, hoverQuadrant, globalHoverQuadrant, isOverHeader, tabs.length, highlightedDividerIndex, handleReorder]); // Added handleReorder dependency

  drop(dropRef);

  const overlayBaseStyle = "absolute bg-blue-500/50 border border-blue-500 rounded-md pointer-events-none transition-opacity duration-100 ease-in-out z-20";
  const showOverlay = isOver && canDrop && hoverQuadrant !== null;

  const CollapseIcon = parentSplitDirection === 'horizontal'
      ? (isCollapsed ? ChevronRight : ChevronLeft)
      : (isCollapsed ? ChevronUp : ChevronDown); 

  return (
    <div ref={dropRef} className={cn(
        "relative flex flex-col h-full w-full rounded-lg overflow-hidden",
        "border border-ring/30",
        "backdrop-blur-xl",
        "transition-all duration-200"
    )} >
       <div className={cn(
        "flex items-center justify-between min-h-[42px] z-10",
        "border-b border-white/10",
        "bg-tab",
        "backdrop-blur-md",
        "transition-all duration-200",
        isOver && isOverHeader && !hoverQuadrant && !highlightedDividerIndex && "bg-white/5 border-white/20" 
      )} >
          <div className="flex items-center overflow-x-auto px-1"> 
            {tabs.length === 0 ? (
              <div className="px-4 py-2 modern-text-sm text-muted-foreground italic animate-fade-in-up">
                Drop tabs here
              </div>
            ) : (
              <> 
                <Divider 
                  index={0} 
                  nodeId={nodeId}
                  isHighlighted={highlightedDividerIndex === 0}
                  onHover={setHighlightedDividerIndex}
                  handleReorder={handleReorder}
                />
                {tabs.map((tab, i) => (
                  <React.Fragment key={tab.id}>
                    <TabItem 
                      tab={tab}
                      isActive={activeTab === tab.id}
                      windowId={nodeId}
                      nodeId={nodeId}
                      onTabClick={() => onTabClick(nodeId, tab.id)}
                      onCloseTab={(e) => onCloseTab(nodeId, tab.id)}
                    />
                    <Divider 
                      index={i + 1}
                      nodeId={nodeId}
                      isHighlighted={highlightedDividerIndex === i + 1}
                      onHover={setHighlightedDividerIndex}
                      handleReorder={handleReorder}
                    />
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all mr-1" 
            onClick={() => onToggleCollapse(nodeId)}
          >
             <CollapseIcon className="h-4 w-4" />
          </Button>
       </div>

       <div className={cn(
          "flex-1 overflow-auto z-10 transition-all duration-200 flex flex-col",
          isCollapsed ? "hidden" : "p-4",
          "bg-tab",
          "backdrop-blur-sm"
      )}>
        <div className="flex-1 min-h-0">
          {tabs.length > 0 && activeTab ? getContentForTab(activeTab) : null}
        </div>
       </div>

       {showOverlay && (
        <>
          <div className={cn(overlayBaseStyle, hoverQuadrant === 'center' ? 'opacity-100 inset-0 animate-blur-in' : 'opacity-0 animate-blur-out')} />
          <div className={cn(overlayBaseStyle, hoverQuadrant === 'top' ? 'opacity-100 top-0 left-0 right-0 h-[30%] animate-scale-in' : 'opacity-0 animate-scale-out')} />
          <div className={cn(overlayBaseStyle, hoverQuadrant === 'bottom' ? 'opacity-100 bottom-0 left-0 right-0 h-[30%] animate-scale-in' : 'opacity-0 animate-scale-out')} />
          <div className={cn(overlayBaseStyle, hoverQuadrant === 'left' ? 'opacity-100 top-0 bottom-0 left-0 w-[30%] animate-scale-in' : 'opacity-0 animate-scale-out')} />
          <div className={cn(overlayBaseStyle, hoverQuadrant === 'right' ? 'opacity-100 top-0 bottom-0 right-0 w-[30%] animate-scale-in' : 'opacity-0 animate-scale-out')} />
        </>
      )}
    </div>
  );
}

// --- Layout Tree State Structure --- 

interface BaseNode {
  id: string;
}

interface SplitNode extends BaseNode {
  type: 'split';
  direction: 'horizontal' | 'vertical';
  children: LayoutNode[];
  sizes: number[];
}

interface WindowNode extends BaseNode {
  type: 'window';
  tabs: Tab[];
  activeTabId: string | null;
  isCollapsed: boolean;
}

type LayoutNode = SplitNode | WindowNode;

// Export the type
export type { LayoutNode };

// --- Props for the main TabSystem container --- 

interface TabSystemProps {
  layout: LayoutNode | null; // Renamed from layoutDefinition, accept null initially
  // Update type to accept updater function like React's setState
  onLayoutChange: (updater: (prevLayout: LayoutNode | null) => LayoutNode | null) => void; 
  getContentForTab: (tabId: string) => ReactNode; // Function to get content
}

// --- Helper Functions for Tree Manipulation --- 

// Finds a node by ID (returns null if not found)
function findNodeRecursively(node: LayoutNode, nodeId: string): LayoutNode | null {
  if (node.id === nodeId) {
    return node;
  }
  if (node.type === 'split') {
    for (const child of node.children) {
      const found = findNodeRecursively(child, nodeId);
      if (found) return found;
    }
  }
  return null;
}

// Creates a new tree with an updated node (immutable)
function updateNodeRecursively(node: LayoutNode, nodeId: string, updateFn: (node: LayoutNode) => LayoutNode): LayoutNode {
  if (node.id === nodeId) {
    return updateFn(node);
  }
  if (node.type === 'split') {
    let childrenChanged = false;
    const newChildren = node.children.map(child => {
      const newChild = updateNodeRecursively(child, nodeId, updateFn);
      if (newChild !== child) {
        childrenChanged = true;
      }
      return newChild;
    });
    if (childrenChanged) {
      return { ...node, children: newChildren };
    }
  }
  return node; // Return original node if no changes in this path
}

// Creates a new tree replacing a target node with a new node (immutable)
function replaceNodeRecursively(node: LayoutNode, targetNodeId: string, newNode: LayoutNode): LayoutNode | null {
  if (node.id === targetNodeId) {
    return newNode;
  }
  if (node.type === 'split') {
    let childrenChanged = false;
    // Filter out nulls after mapping to ensure correct type
    const newChildren = node.children.map(child => {
      const newChild = replaceNodeRecursively(child, targetNodeId, newNode);
      if (newChild !== child) { childrenChanged = true; }
      return newChild;
    }).filter((child): child is LayoutNode => child !== null); // Type guard filter

    if (childrenChanged) {
      // If children array becomes empty or invalid after replacement, handle it
      if (newChildren.length === 0) return null;
      if (newChildren.length === 1) return newChildren[0]; // Collapse split
      return { ...node, children: newChildren };
    }
  }
  return node;
}

// Recursively prunes empty window nodes and simplifies splits with single children
function pruneEmptyNodes(node: LayoutNode | null): LayoutNode | null {
  if (!node) return null;

  if (node.type === 'window') {
    return node.tabs.length > 0 ? node : null;
  }

  // node.type === 'split'
  let childrenChanged = false;
  // Filter out nulls after mapping to ensure correct type
  const newChildren = node.children.map(child => {
    const prunedChild = pruneEmptyNodes(child);
    if (prunedChild !== child) { childrenChanged = true; }
    return prunedChild;
  }).filter((child): child is LayoutNode => child !== null); // Type guard filter

  if (childrenChanged || newChildren.length !== node.children.length) { // Also check if length changed
    if (newChildren.length === 0) return null;
    if (newChildren.length === 1) return newChildren[0]; // Collapse split
    return { ...node, children: newChildren };
  }

  return node;
}

// Generate unique IDs for nodes
const generateId = () => `node_${Math.random().toString(36).substring(2, 9)}`;

// --- Helper function for comparing size arrays with tolerance ---
const areSizesEqual = (sizes1: number[], sizes2: number[], tolerance = 1e-5): boolean => {
  if (!sizes1 || !sizes2 || sizes1.length !== sizes2.length) return false;
  for (let i = 0; i < sizes1.length; i++) {
    if (Math.abs(sizes1[i] - sizes2[i]) > tolerance) {
      return false;
    }
  }
  return true;
};

// --- Main TabSystem component refactored --- 

export function TabSystem({ layout, onLayoutChange, getContentForTab }: TabSystemProps) {
  const tabSystemRef = useRef<HTMLDivElement>(null);
  const [globalHoverQuadrant, setGlobalHoverQuadrant] = useState<Quadrant>(null);

  // --- Drop Handler for the MAIN TabSystem Container --- 
  const [{ isOverGlobal }, globalDrop] = useDrop(() => ({
    accept: ItemTypes.TAB,
    drop: (item: DragItem, monitor) => {
      const currentGlobalQuadrant = globalHoverQuadrant;
      setGlobalHoverQuadrant(null);

      if (currentGlobalQuadrant !== null) {
        console.log("Global Drop Triggered based on captured state:", currentGlobalQuadrant);
        handleDrop(item, '__GLOBAL__', currentGlobalQuadrant);
      } else {
        if (monitor.didDrop()) {
          console.log("Nested target handled the drop.");
        } else {
          console.log("Drop occurred on container, but no global quadrant active and no child handled it.");
        }
      }
    },
    hover(item: DragItem, monitor) {
      if (!tabSystemRef.current) { 
         if (globalHoverQuadrant !== null) setGlobalHoverQuadrant(null);
         return; 
      }
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) { 
         if (globalHoverQuadrant !== null) setGlobalHoverQuadrant(null);
         return; 
      }

      const hoverBoundingRect = tabSystemRef.current.getBoundingClientRect();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;
      
      // ** Check if over potential header area FIRST **
      // We need to estimate header presence based on top-level layout
      // Simple approximation: if near top edge, assume it might be over a header
      const isPotentiallyOverHeader = hoverClientY < HEADER_HEIGHT + 20; // Add buffer

      if (isPotentiallyOverHeader) {
         // If potentially over header, DO NOT trigger global edge
         if (globalHoverQuadrant !== null) setGlobalHoverQuadrant(null);
         return; 
      }

      // ** Calculate Global Edge Quadrant **
      const edgeThreshold = 80; // Pixels from edge
      let newQuadrant: Quadrant = null;
      if (hoverClientY < edgeThreshold) newQuadrant = 'top';
      else if (hoverClientY > hoverBoundingRect.height - edgeThreshold) newQuadrant = 'bottom';
      else if (hoverClientX < edgeThreshold) newQuadrant = 'left';
      else if (hoverClientX > hoverBoundingRect.width - edgeThreshold) newQuadrant = 'right';

      if (newQuadrant !== globalHoverQuadrant) {
        setGlobalHoverQuadrant(newQuadrant);
      }
    },
    collect: (monitor) => ({ isOverGlobal: monitor.isOver(), }),
  }), [globalHoverQuadrant, layout, onLayoutChange]);

  globalDrop(tabSystemRef);

  // --- Combined Drop Handler --- 
  const handleDrop = useCallback((draggedItem: DragItem, targetNodeId: string, quadrant: Quadrant) => {
    console.log("Handle Drop:", { ...draggedItem, tabData: '...' }, "Target:", targetNodeId, "Quadrant:", quadrant);
    const { windowId: sourceNodeId, tabData: droppedTab } = draggedItem;

    // Call onLayoutChange with an updater function
    onLayoutChange((prevLayout: LayoutNode | null): LayoutNode | null => { 
      if (!prevLayout) return null; // Return null if previous layout was null

      let layoutAfterSourceUpdate = updateNodeRecursively(prevLayout, sourceNodeId, (node) => {
        if (node.type !== 'window') return node;
        const remainingTabs = node.tabs.filter(t => t.id !== droppedTab.id);
        let newActiveTabId = node.activeTabId;
        if (node.activeTabId === droppedTab.id) {
          newActiveTabId = remainingTabs[0]?.id ?? null;
        }
        // Tab data is already simplified in the DragItem, but ensure consistency if needed
        return { ...node, tabs: remainingTabs, activeTabId: newActiveTabId };
      });

      let finalLayout: LayoutNode | null = layoutAfterSourceUpdate;
      const simplifiedDroppedTab = { id: droppedTab.id, title: droppedTab.title, icon: droppedTab.icon, iconType: droppedTab.iconType };

      if (targetNodeId === '__GLOBAL__') {
         console.log("Performing GLOBAL SPLIT");
         if (!quadrant || quadrant === 'center') return prevLayout; // Return previous layout if no split

         const newWindowNode: WindowNode = { id: generateId(), type: 'window', tabs: [simplifiedDroppedTab], activeTabId: droppedTab.id, isCollapsed: false };
         const splitDirection = (quadrant === 'top' || quadrant === 'bottom') ? 'vertical' : 'horizontal';
         const newPaneFirst = (quadrant === 'top' || quadrant === 'left');

         const newRootSplitNode: SplitNode = {
             id: generateId(),
             type: 'split',
             direction: splitDirection,
             sizes: [50, 50],
             children: newPaneFirst
                 ? [newWindowNode, layoutAfterSourceUpdate]
                 : [layoutAfterSourceUpdate, newWindowNode],
         };
         finalLayout = newRootSplitNode;

      } else if (quadrant === 'center') {
         console.log("Performing MERGE");
         finalLayout = updateNodeRecursively(layoutAfterSourceUpdate, targetNodeId, (node) => {
           if (node.type !== 'window') return node;
           if (node.tabs.some(t => t.id === droppedTab.id)) return node;
           return { ...node, tabs: [...node.tabs, simplifiedDroppedTab], activeTabId: droppedTab.id };
         });
      } else {
         console.log("Performing SPLIT");
         const originalTargetNode = findNodeRecursively(layoutAfterSourceUpdate, targetNodeId);

         if (originalTargetNode?.type === 'window') {
             const newWindowNode: WindowNode = {
               id: generateId(),
               type: 'window',
               tabs: [simplifiedDroppedTab],
               activeTabId: droppedTab.id,
               isCollapsed: false,
             };

             const splitDirection = (quadrant === 'top' || quadrant === 'bottom') ? 'vertical' : 'horizontal';
             const newPaneFirst = (quadrant === 'top' || quadrant === 'left');

             const newSplitNode: SplitNode = {
                 id: generateId(),
                 type: 'split',
                 direction: splitDirection,
                 sizes: [50, 50],
                 children: newPaneFirst 
                     ? [newWindowNode, originalTargetNode]
                     : [originalTargetNode, newWindowNode],
             };

             finalLayout = replaceNodeRecursively(layoutAfterSourceUpdate, targetNodeId, newSplitNode);
            
         } else {
              console.warn("Split target node not found or not a window node. Aborting split.");
              finalLayout = layoutAfterSourceUpdate;
         }
      }

      const prunedLayout = pruneEmptyNodes(finalLayout);
      // Return the final pruned layout, or null if pruning resulted in nothing
      return prunedLayout; 
    });

  }, [onLayoutChange]); // Dependency: only onLayoutChange

  // Set Active Tab Logic
  const handleTabClick = useCallback((nodeId: string, tabId: string) => {
    console.log("Set active tab:", tabId, "in node:", nodeId);
    
    // Use onLayoutChange with simple update (no need for updater function here)
    if (!layout) return;
    const newLayout = updateNodeRecursively(layout, nodeId, (node) => {
      if (node.type !== 'window' || node.activeTabId === tabId) return node;
      return { ...node, activeTabId: tabId };
    });
    if (newLayout !== layout) {
       // Directly pass the new layout object
       onLayoutChange(() => newLayout); 
    }
  }, [layout, onLayoutChange]); // Added layout and onLayoutChange dependencies

  // Close Tab Logic
  const handleCloseTab = useCallback((nodeId: string, tabId: string) => {
    console.log("Close tab:", tabId, "in node:", nodeId);
    
    // Use onLayoutChange with updater function
    onLayoutChange((prevLayout: LayoutNode | null): LayoutNode | null => {
      if (!prevLayout) return null;
      let layoutAfterUpdate = updateNodeRecursively(prevLayout, nodeId, (node) => {
        if (node.type !== 'window') return node;
        const remainingTabs = node.tabs.filter(t => t.id !== tabId);
        let newActiveTabId = node.activeTabId;
        if (node.activeTabId === tabId) {
          newActiveTabId = remainingTabs[0]?.id ?? null;
        }
        return { ...node, tabs: remainingTabs, activeTabId: newActiveTabId };
      });
      
      const prunedLayout = pruneEmptyNodes(layoutAfterUpdate);
      // Return the pruned layout (could be null if last tab closed)
      return prunedLayout;
    });
     
  }, [onLayoutChange]); // Dependency: only onLayoutChange
  
  // Toggle Collapse Logic
  const handleToggleCollapse = useCallback((nodeId: string) => {
    console.log("Toggle collapse for node:", nodeId);
    
    // Use onLayoutChange with simple update
    if (!layout) return;
    const newLayout = updateNodeRecursively(layout, nodeId, (node) => {
      if (node.type !== 'window') return node;
      return { ...node, isCollapsed: !node.isCollapsed };
    });
    if (newLayout !== layout) {
        // Directly pass the new layout object
        onLayoutChange(() => newLayout);
    }
  }, [layout, onLayoutChange]); // Added layout and onLayoutChange dependencies

  // --- New handleReorder Function --- 
  const handleReorder = useCallback((draggedItem: DragItem, targetNodeId: string, targetIndex: number) => {
    console.log(`Handle Reorder: Item ${draggedItem.id} from ${draggedItem.windowId} to window ${targetNodeId} at index ${targetIndex}`);
    const { windowId: sourceNodeId, tabData: droppedTab } = draggedItem;

    // Use onLayoutChange with updater function
    onLayoutChange((prevLayout: LayoutNode | null): LayoutNode | null => {
        if (!prevLayout) return null;

        // Prevent dropping onto itself in the exact same logical spot
        if (sourceNodeId === targetNodeId) {
          const sourceNode = findNodeRecursively(prevLayout, sourceNodeId);
          if(sourceNode?.type === 'window') {
              const originalIndex = sourceNode.tabs.findIndex(t => t.id === droppedTab.id);
              if (targetIndex === originalIndex || targetIndex === originalIndex + 1) {
                  console.log("Reorder: Drop target is same as source, no change.");
                  return prevLayout; // Return previous layout unmodified
              }
          }
        }
        
        const simplifiedDroppedTab = { id: droppedTab.id, title: droppedTab.title, icon: droppedTab.icon, iconType: droppedTab.iconType };

        // 1. Remove from source
        let layoutAfterSourceUpdate = updateNodeRecursively(prevLayout, sourceNodeId, (node) => {
            if (node.type !== 'window') return node;
            const tabExists = node.tabs.some(t => t.id === simplifiedDroppedTab.id);
            if (!tabExists) return node; // Tab might have been moved already

            const remainingTabs = node.tabs.filter(t => t.id !== simplifiedDroppedTab.id);
            let newActiveTabId = node.activeTabId;
            if (node.activeTabId === simplifiedDroppedTab.id && remainingTabs.length > 0) {
              const originalIndex = node.tabs.findIndex(t => t.id === simplifiedDroppedTab.id);
              newActiveTabId = remainingTabs[Math.min(originalIndex, remainingTabs.length - 1)].id;
            } else if (remainingTabs.length === 0) {
              newActiveTabId = null;
            }
            return { ...node, tabs: remainingTabs, activeTabId: newActiveTabId };
        });

        // 2. Add to target at specific index
        let layoutAfterTargetUpdate = updateNodeRecursively(layoutAfterSourceUpdate, targetNodeId, (node) => {
            if (node.type !== 'window') return node;
            const newTabs = [...node.tabs];
            
            let effectiveTargetIndex = targetIndex;
            if (sourceNodeId === targetNodeId) {
               // Find original index within the *previous* state before removal
               const originalSourceNode = findNodeRecursively(prevLayout, sourceNodeId);
               const originalIndex = originalSourceNode?.type === 'window' 
                  ? originalSourceNode.tabs.findIndex(t => t.id === simplifiedDroppedTab.id) 
                  : -1;
               if (originalIndex !== -1 && targetIndex > originalIndex) {
                   effectiveTargetIndex = targetIndex - 1;
               }
            }

            const insertionPoint = Math.max(0, Math.min(effectiveTargetIndex, newTabs.length)); 
            newTabs.splice(insertionPoint, 0, simplifiedDroppedTab); // Use simplified tab data
            const newActiveTabId = (sourceNodeId !== targetNodeId) ? simplifiedDroppedTab.id : node.activeTabId;
            return { ...node, tabs: newTabs, activeTabId: newActiveTabId }; 
        });

        // 3. Prune if necessary
        const prunedLayout = pruneEmptyNodes(layoutAfterTargetUpdate);
        return prunedLayout ?? prevLayout; // Return pruned or previous layout
    });
  }, [onLayoutChange]); // Dependency: only onLayoutChange

  // Recursive rendering function (Passing handlers and getContentForTab)
  const renderNode = (node: LayoutNode, parentDirection?: 'horizontal' | 'vertical'): ReactNode => {
    if (node.type === 'split') {
      return (
        <Allotment 
          key={node.id} 
          vertical={node.direction === 'vertical'} 
          defaultSizes={node.sizes} // Use defaultSizes for initial render
          onChange={(sizes: number[]) => {
            // Refined onChange handler
            onLayoutChange((prevLayout) => { 
              if (!prevLayout) return null;
              // Find the current node within the *previous* layout state
              const currentNode = findNodeRecursively(prevLayout, node.id);
              
              // Check node type and if sizes actually changed using tolerance
              if (currentNode?.type !== 'split' || areSizesEqual(currentNode.sizes, sizes)) {
                  // If node not found, not a split, or sizes are effectively the same, 
                  // return the previous state to prevent unnecessary updates/loops.
                  return prevLayout; 
              }
              
              // If sizes are different, update the node
              console.log(`[TabSystem] Updating sizes for ${node.id}:`, sizes);
              return updateNodeRecursively(prevLayout, node.id, (n) => {
                  // The node found by updateNodeRecursively should be the correct one
                  // We spread 'n' assuming it contains all properties of the split node
                  return { ...n, sizes: sizes }; 
              });
            });
          }}
        >
          {node.children.map(child => renderNode(child, node.direction))}
        </Allotment>
      );
    } else { // node.type === 'window'
      const currentMinSize = node.isCollapsed ? HEADER_HEIGHT : HEADER_HEIGHT + 16;
      return (
        <Allotment.Pane 
           key={node.id} 
           priority={LayoutPriority.Low} 
           className="h-full p-2" 
           minSize={currentMinSize}
        > 
          <TabWindow
            nodeId={node.id}
            tabs={node.tabs}
            activeTab={node.activeTabId ?? ''}
            isCollapsed={node.isCollapsed}
            onTabClick={handleTabClick}
            onCloseTab={handleCloseTab}
            onToggleCollapse={handleToggleCollapse}
            parentSplitDirection={parentDirection}
            handleDrop={handleDrop}
            globalHoverQuadrant={globalHoverQuadrant}
            handleReorder={handleReorder}
            getContentForTab={getContentForTab}
          />
        </Allotment.Pane>
      );
    }
  };

  // Style for GLOBAL overlays
  const globalOverlayBaseStyle = "absolute bg-green-500/30 border border-green-500 pointer-events-none transition-opacity duration-100 ease-in-out z-30";
  const showGlobalOverlay = isOverGlobal && globalHoverQuadrant !== null;

  // Render null if layout is not yet initialized
  if (!layout) {
    return null; // Or a loading indicator
  }

  return (
    <div ref={tabSystemRef} className="relative flex-1 overflow-hidden h-full">
      {renderNode(layout)} 

      {showGlobalOverlay && (
        <>
          <div className={cn(globalOverlayBaseStyle, globalHoverQuadrant === 'top' ? 'opacity-100 top-0 left-0 right-0 h-[20%] animate-scale-in' : 'opacity-0 animate-scale-out')} />
          <div className={cn(globalOverlayBaseStyle, globalHoverQuadrant === 'bottom' ? 'opacity-100 bottom-0 left-0 right-0 h-[20%] animate-scale-in' : 'opacity-0 animate-scale-out')} />
          <div className={cn(globalOverlayBaseStyle, globalHoverQuadrant === 'left' ? 'opacity-100 top-0 bottom-0 left-0 w-[20%] animate-scale-in' : 'opacity-0 animate-scale-out')} />
          <div className={cn(globalOverlayBaseStyle, globalHoverQuadrant === 'right' ? 'opacity-100 top-0 bottom-0 right-0 w-[20%] animate-scale-in' : 'opacity-0 animate-scale-out')} />
        </>
      )}
    </div>
  );
} 