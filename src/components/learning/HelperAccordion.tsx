import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HelperResource, ModuleDefinition, SubmoduleDefinition } from '@/lib/learning/types';
import React from "react";
import { BookOpen, Brain } from "lucide-react";

interface HelperAccordionProps {
  submodule?: SubmoduleDefinition;
  module?: ModuleDefinition;
  moduleOverviewMode?: boolean;
}

export function HelperAccordion({ submodule, module, moduleOverviewMode }: HelperAccordionProps) {
  const helpersToDisplay: HelperResource[] = [];
  let accordionTitle = "Help Resource";
  let triggerIcon = <BookOpen className="w-4 h-4 mr-2"/>;

  if (moduleOverviewMode && module) {
    accordionTitle = `${module.title_en} - Overview`;
    triggerIcon = <BookOpen className="w-4 h-4 mr-2"/>;
    let hasAnyHelpers = false;
    module.submodules.forEach(sub => {
      if (sub.helpers && sub.helpers.length > 0) {
        hasAnyHelpers = true;
        helpersToDisplay.push({ title: `### ${sub.title_en}`, content: '', contentType: 'markdown' });
        helpersToDisplay.push(...sub.helpers);
        helpersToDisplay.push({ title: `---`, content: '', contentType: 'markdown' });
      }
    });
    if (!hasAnyHelpers) {
       helpersToDisplay.push({ title: "No Resources", content: "No specific help resources found for this module." });
    }
  } else if (submodule && submodule.helpers && submodule.helpers.length > 0) {
    accordionTitle = `${submodule.title_en} - Help`;
    triggerIcon = <Brain className="w-4 h-4 mr-2"/>;
    helpersToDisplay.push(...submodule.helpers);
  } else {
     helpersToDisplay.push({ title: "No Resources", content: "No specific help resources found for this section." });
  }

  // Remove trailing separator if added
  if (moduleOverviewMode && helpersToDisplay.length > 0 && helpersToDisplay[helpersToDisplay.length - 1]?.title === '---') {
    helpersToDisplay.pop();
  }

  // Don't render accordion if there's nothing substantial to show (only "No Resources")
  if (helpersToDisplay.length === 1 && helpersToDisplay[0].title === "No Resources") {
      // Optionally render a disabled trigger or nothing at all
      // return <div className="text-muted-foreground text-sm italic">No help available.</div>;
      return null;
  }

  return (
    // Allow multiple sections to be open if needed: type="multiple"
    // Collapsible makes only one open at a time: type="single" collapsible
    <Accordion type="single" collapsible className="w-full mt-6 mb-6">
      <AccordionItem value="help-content">
        <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center">
                {triggerIcon}
                {accordionTitle}
            </div>
        </AccordionTrigger>
        <AccordionContent>
          {/* Added prose styles for better markdown rendering */}
          <div className="prose dark:prose-invert max-w-none py-4 text-sm">
            {helpersToDisplay.map((helper, index) => (
              <div key={index} className="mb-6 helper-resource-item">
                {/* Render title only if it's not already a markdown header/separator */}
                {!helper.title.startsWith('#') && !helper.title.startsWith('---') && helper.title !== "No Resources" && (
                   <h4 className="font-semibold mb-2 text-base">{helper.title}</h4>
                )}
                {/* Render markdown content */}
                {helper.content && (helper.contentType === 'markdown' || !helper.contentType) && (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                          // Add basic table styling & Fix types/comma
                          table: ({node, ...props}: {node?: any; [key: string]: any}) => <table className="table-auto w-full my-4 border-collapse border border-border" {...props} />,
                          th: ({node, ...props}: {node?: any; [key: string]: any}) => <th className="border border-border px-2 py-1 text-left bg-muted" {...props} />,
                          // Corrected: Removed stray comma from td
                          td: ({node, ...props}: {node?: any; [key: string]: any}) => <td className="border border-border px-2 py-1" {...props} />,
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
} 