'use client';

import React, { FC, HTMLAttributes, ClassAttributes } from 'react';
import ReactMarkdown, { Options } from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Import KaTeX CSS
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Define ExtraProps interface for custom props passed by plugins
interface ExtraProps {
  node?: any; 
  inline?: boolean;
  isHeader?: boolean;
  // Add other potential props passed by rehype/remark plugins
}

// Custom components to integrate with Shadcn UI and add styling
const customComponents: Options['components'] = {
  p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-3" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mt-5 mb-3" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 pl-4" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 pl-4" {...props} />,
  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 pl-4 italic my-4 text-muted-foreground" {...props} />,
  code: ({ node, inline, className, children, ...props }: ClassAttributes<HTMLElement> & HTMLAttributes<HTMLElement> & ExtraProps) => {
    const match = /language-(\w+)/.exec(className || '');
    if (inline) {
      return <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
    }
    // TODO: Add syntax highlighting library here (e.g., rehype-highlight) for block code
    return (
      <pre className="bg-muted p-3 rounded-md overflow-x-auto my-4">
        <code className={cn("font-mono text-sm", className)} {...props}>
          {children}
        </code>
      </pre>
    );
  },
  table: ({ node, ...props }) => <Table className="my-4 border" {...props} />,
  thead: ({ node, ...props }) => <TableHeader className="bg-muted/50" {...props} />,
  tbody: ({ node, ...props }) => <TableBody {...props} />,
  tr: ({ node, isHeader, ...props }: ClassAttributes<HTMLTableRowElement> & HTMLAttributes<HTMLTableRowElement> & ExtraProps) => <TableRow className={cn(isHeader ? "" : "border-b", "m-0 p-0 even:bg-muted/30")} {...props} />,
  th: ({ node, ...props }) => <TableHead className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />,
  td: ({ node, ...props }) => <TableCell className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />,
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={customComponents}
        // TODO: Add rehype-highlight or similar for code block syntax highlighting
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer; 