import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

interface HintButtonProps {
  hint?: string;
  initialShowHint?: boolean;
  disabled?: boolean;
}

/**
 * A reusable component for displaying hints in learning exercises
 * Can be used across different modal types to provide a consistent UI
 */
export const HintButton: React.FC<HintButtonProps> = ({
  hint,
  initialShowHint = false,
  disabled = false,
}) => {
  const [showHint, setShowHint] = useState(initialShowHint);

  // Don't render anything if no hint is provided
  if (!hint) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowHint(!showHint)}
        className="w-fit"
        disabled={disabled}
      >
        {showHint ? 'Hide Hint' : 'Show Hint'}
      </Button>
      
      {showHint && (
        <div className="text-sm text-muted-foreground italic">
          {hint}
        </div>
      )}
    </div>
  );
};

export default HintButton; 