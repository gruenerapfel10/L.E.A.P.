import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HelperResource, ModuleDefinition, SubmoduleDefinition } from '@/lib/learning/types';
import { X } from 'lucide-react';

interface HelperSidePanelProps {
  submodule?: SubmoduleDefinition | null;
  module?: ModuleDefinition | null;
  moduleOverviewMode?: boolean;
  onClose: () => void;
}

export function HelperSidePanel({ submodule, module, moduleOverviewMode, onClose }: HelperSidePanelProps) {
  const helpersToDisplay: HelperResource[] = [];
  let panelTitle = "Help Resource";

  if (moduleOverviewMode && module) {
    panelTitle = `${module.title_en} - Overview`;
    module.submodules.forEach(sub => {
      if (sub.helpers && sub.helpers.length > 0) {
        helpersToDisplay.push({ title: `### ${sub.title_en}`, content: '', contentType: 'markdown' });
        helpersToDisplay.push(...sub.helpers);
        helpersToDisplay.push({ title: `---`, content: '', contentType: 'markdown' });
      }
    });
  } else if (submodule && submodule.helpers && submodule.helpers.length > 0) {
    panelTitle = `${submodule.title_en} - Help`;
    helpersToDisplay.push(...submodule.helpers);
  } else {
    helpersToDisplay.push({ title: "No Resources", content: "No specific help resources found for this section." });
  }

  if (moduleOverviewMode && helpersToDisplay.length > 0 && helpersToDisplay[helpersToDisplay.length - 1]?.title === '---') {
    helpersToDisplay.pop();
  }

  return (
    <div className="relative h-full w-full min-w-0 p-4 z-50 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center pb-4 border-b">
        <h2 className="text-lg font-bold">{panelTitle}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="pt-4 prose dark:prose-invert max-w-none">
        {helpersToDisplay.map((helper, index) => (
          <div key={index} className="mb-6">
            {!helper.title.startsWith('#') && !helper.title.startsWith('---') && helper.title !== "No Resources" && (
              <h4 className="font-semibold mb-2 text-base">{helper.title}</h4>
            )}
            {helper.content && (helper.contentType === 'markdown' || !helper.contentType) && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({node, ...props}: {node?: any; [key: string]: any}) => <table className="table-auto w-full my-4 border-collapse border border-border" {...props} />,
                  th: ({node, ...props}: {node?: any; [key: string]: any}) => <th className="border border-border px-2 py-1 text-left bg-muted" {...props} />,
                  td: ({node, ...props}: {node?: any; [key: string]: any}) => <td className="border border-border px-2 py-1" {...props} />,
                  hr: ({node, ...props}: {node?: any; [key: string]: any}) => <hr className="my-4 border-border" {...props} />
                }}
              >
                {helper.content}
              </ReactMarkdown>
            )}
            {helper.content && helper.contentType && helper.contentType !== 'markdown' && (
              <p><i>Content type {helper.contentType} not yet supported.</i></p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 