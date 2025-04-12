'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { helperSheetRegistry } from '@/lib/learning/helper-sheets/helper-sheet-registry';
import type { HelperSheet } from '@/lib/learning/types';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface HelperSheetLibraryDisplayProps {
  // Add any specific props needed, e.g., filters, initial selection
}

export const HelperSheetLibraryDisplay: React.FC<HelperSheetLibraryDisplayProps> = () => {
  const { i18n } = useTranslation();
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [allSheets, setAllSheets] = useState<HelperSheet[]>([]);

  useEffect(() => {
    // Fetch all sheets when the component mounts
    // Note: loadHelperSheets() should ideally be called higher up (e.g., layout or page)
    //       to ensure registry is populated before this component renders.
    //       Assuming it's called elsewhere for now.
    setAllSheets(helperSheetRegistry.getAllHelperSheets());
  }, []); // Runs once on mount

  // Helper function to get localized title/content
  const getLocalizedSheetData = (sheet: HelperSheet | undefined) => {
    if (!sheet) return { title: 'Error', content: 'Sheet not found' };
    const lang = i18n.language;
    const localized = sheet.localization[lang];
    return {
      title: localized?.title || sheet.title_en,
      content: localized?.content || sheet.content
    };
  };

  const sheetToShow = selectedSheetId 
    ? allSheets.find(s => s.id === selectedSheetId) 
    : null;

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Library Navigation Header (only when showing specific sheet) */}
      {sheetToShow && (
        <div className="flex items-center justify-start flex-none mb-[-10px]">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedSheetId(null)} // Go back to library list
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library List
          </Button>
        </div>
      )}

      {/* Library Content Area */}
      <div className="flex-1 overflow-y-auto">
        {sheetToShow ? (
          // Display selected sheet from library
          (() => {
            const { title, content } = getLocalizedSheetData(sheetToShow);
            return (
              <div className="flex flex-col gap-4 p-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{title}</h2>
                  {sheetToShow.metadata?.cefrLevel && (
                    <span className="text-sm px-2 py-1 rounded bg-primary/10 text-primary">
                      CEFR {sheetToShow.metadata.cefrLevel}
                    </span>
                  )}
                </div>
                {sheetToShow.metadata?.tags && (
                  <div className="flex flex-wrap gap-2">
                    {sheetToShow.metadata.tags.map((tag: string) => (
                      <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <MarkdownRenderer content={content} />
              </div>
            );
          })()
        ) : (
          // Display library list
          <div className="flex flex-col gap-4">
            {/* Title is usually handled by the parent page */}
            {/* <h2 className="text-xl font-semibold mb-2">Helper Sheet Library</h2> */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allSheets.map((sheet: HelperSheet) => {
                const { title } = getLocalizedSheetData(sheet);
                return (
                  <Button 
                    key={sheet.id} 
                    variant="outline"
                    className="p-4 border rounded-lg bg-card hover:bg-muted/50 h-auto text-left flex flex-col items-start gap-2 shadow-sm transition-all hover:shadow-md"
                    onClick={() => setSelectedSheetId(sheet.id)}
                  >
                    <h4 className="font-medium text-base">{title}</h4>
                    {sheet.metadata?.tags && (
                      <div className="flex flex-wrap gap-1">
                        {sheet.metadata.tags.map((tag: string) => (
                          <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto text-xs text-muted-foreground pt-2">
                      CEFR Level: {sheet.metadata?.cefrLevel || 'N/A'}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelperSheetLibraryDisplay; 