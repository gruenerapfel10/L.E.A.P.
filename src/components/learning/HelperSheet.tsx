'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ReactMarkdown from 'react-markdown'; // Corrected: Use default import
import { HelperResource, ModuleDefinition, SubmoduleDefinition } from '@/lib/learning/types'; // Adjust path if needed
import React from "react";

interface HelperSheetProps {
  triggerElement: React.ReactNode; // The element that opens the sheet
  submodule?: SubmoduleDefinition; // Pass the specific submodule for single view
  module?: ModuleDefinition; // Full module for overview mode
  moduleOverviewMode?: boolean; // Flag to indicate overview
}

export function HelperSheet({ triggerElement, submodule, module, moduleOverviewMode }: HelperSheetProps) {
  const helpersToDisplay: HelperResource[] = [];
  let sheetTitle = "Help Resource";
  let sheetDescription = "Review this resource for help with the current topic.";

  if (moduleOverviewMode && module) {
      sheetTitle = `${module.title_en} - Overview`;
      sheetDescription = `Overview of help resources for the ${module.title_en} module.`;
      let hasAnyHelpers = false;
      module.submodules.forEach(sub => {
          if (sub.helpers && sub.helpers.length > 0) {
              hasAnyHelpers = true;
              // Add submodule title as a markdown header
              helpersToDisplay.push({ title: `### ${sub.title_en}`, content: '', contentType: 'markdown' });
              helpersToDisplay.push(...sub.helpers);
              helpersToDisplay.push({ title: `---`, content: '', contentType: 'markdown' }); // Add a separator
          }
      });
      if (!hasAnyHelpers) {
         helpersToDisplay.push({ title: "No Resources", content: "No specific help resources found for this module." });
      }

  } else if (submodule && submodule.helpers && submodule.helpers.length > 0) {
      sheetTitle = `${submodule.title_en} - Help`;
      helpersToDisplay.push(...submodule.helpers);
  } else {
       // Default case if opened without specific submodule/module or no helpers
       helpersToDisplay.push({ title: "No Resources", content: "No specific help resources found for this section." });
  }

  // Remove trailing separator if added
  if (moduleOverviewMode && helpersToDisplay.length > 0 && helpersToDisplay[helpersToDisplay.length - 1]?.title === '---') {
      helpersToDisplay.pop();
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{triggerElement}</SheetTrigger>
      <div className="absolute right-0 top-0 h-full w-80 bg-card shadow-lg z-50 overflow-y-auto">
        <SheetContent className="w-[90vw] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] xl:w-[50vw] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>{sheetTitle}</SheetTitle>
            <SheetDescription>
              {sheetDescription}
            </SheetDescription>
          </SheetHeader>
          {/* Added prose styles for better markdown rendering */}
          <div className="prose dark:prose-invert max-w-none py-4 text-sm">
            {helpersToDisplay.map((helper, index) => (
              <div key={index} className="mb-6 helper-resource-item">
                {/* Render title only if it's not already a markdown header */}
                {!helper.title.startsWith('#') && !helper.title.startsWith('---') && helper.title !== "No Resources" && (
                   <h4 className="font-semibold mb-2 text-base">{helper.title}</h4>
                )}
                {/* Render markdown content */}
                {helper.content && (helper.contentType === 'markdown' || !helper.contentType) && (
                    <ReactMarkdown
                      components={{ // Add basic table styling & Fix types/comma
                          table: ({node, ...props}: {node?: any; [key: string]: any}) => <table className="table-auto w-full my-4 border-collapse border border-border" {...props} />,
                          th: ({node, ...props}: {node?: any; [key: string]: any}) => <th className="border border-border px-2 py-1 text-left bg-muted" {...props} />,
                          td: ({node, ...props}: {node?: any; [key: string]: any}) => <td className="border border-border px-2 py-1" {...props} />, // Removed comma
                          hr: ({node, ...props}: {node?: any; [key: string]: any}) => <hr className="my-4 border-border" {...props} /> 
                      }}
                    >
                        {helper.content}
                    </ReactMarkdown>
                )}
                {/* Add logic for other content types if needed */}
                {helper.content && helper.contentType && helper.contentType !== 'markdown' && (
                    <p><i>Content type {helper.contentType} not yet supported.</i></p>
                )}
              </div>
            ))}
          </div>
        </SheetContent>
      </div>
    </Sheet>
  );
}
