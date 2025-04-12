'use client';

import React from 'react';
import { HelperSheetLibraryDisplay } from '@/components/learning/HelperSheetLibraryDisplay';
import { loadHelperSheets } from '@/lib/learning/helper-sheets/loader';

// Ensure helper sheets are loaded when this page might be accessed
// Ideally, loading should happen at a higher level (e.g., in the main layout)
// if the registry isn't guaranteed to be populated already.
loadHelperSheets();

export default function LibraryPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">Grammar Library</h1>
        {/* Add filtering/sorting controls here if needed */}
      </div>
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <HelperSheetLibraryDisplay />
      </div>
    </div>
  );
} 