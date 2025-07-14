"use client";

import React, { useState, useEffect } from 'react';

interface ExamTimerProps {
  duration: number; // Duration in minutes
  onTimeUp: () => void;
  isActive: boolean;
}

export function ExamTimer({ duration, onTimeUp, isActive }: ExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert to seconds

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const timeColor = timeLeft < 300 ? 'text-red-500' : 'text-foreground'; // Red when less than 5 minutes

  return (
    <div className="fixed top-4 right-4 bg-card p-4 rounded-lg shadow-lg">
      <div className="text-sm font-medium mb-1">Time Remaining</div>
      <div className={`text-2xl font-bold ${timeColor}`}>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
    </div>
  );
} 