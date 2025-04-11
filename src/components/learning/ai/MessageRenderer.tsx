'use client';

import React from 'react';
import ReactMarkdown, { Options } from 'react-markdown';
import remarkMath from 'remark-math';
import InlineMath from '@matejmazur/react-katex';
import BlockMath from '@matejmazur/react-katex';
import 'katex/dist/katex.min.css'; // Import KaTeX CSS
import { cn } from '@/lib/utils';

// Basic CodeBlock component (replace with your actual component if available)
const CodeBlock: React.FC<{
  language: string;
  value: string;
  className?: string;
}> = ({ language, value, className = '' }) => {
  return (
    <pre 
      className={cn(
        "mb-2 rounded-md border bg-muted/30 p-4 font-mono text-sm overflow-x-auto",
        className
      )}
    >
      <code className={`language-${language}`}>{value}</code>
    </pre>
  );
};

interface MessageRendererProps {
  content: string;
}

export function MessageRenderer({ content }: MessageRendererProps) {
  const components: Options['components'] = {
    // Handle math nodes created by remark-math
    span: ({ node, className, children, ...props }: any) => {
      if (className === 'math-inline') {
        return <InlineMath math={String(children)} />;
      }
      if (className === 'math-display') {
        return <BlockMath math={String(children)} />;
      }
      // Default span rendering if not math
      return <span className={className} {...props}>{children}</span>;
    },
    // Code blocks (```...```) and inline code (`...`)
    code: ({ node, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1] : 'text';
      const isInline = !className?.includes('language-') && node?.tagName === 'code';
      
      if (!isInline) {
        return (
          <CodeBlock
            language={lang}
            value={String(children).replace(/\n$/, '')}
            {...props}
          />
        );
      } else {
        // Inline code (`...`)
        return (
          <code 
            className={cn(
              "relative rounded bg-muted/50 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-muted-foreground",
              className
            )} 
            {...props}
          >
            {children}
          </code>
        );
      }
    },
    // Custom paragraph styling if needed
    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
    // Custom list styling
    ul: ({ node, ...props }) => <ul className="list-disc space-y-1 pl-6 mb-2" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal space-y-1 pl-6 mb-2" {...props} />,
    li: ({ node, ...props }) => <li {...props} />,
    // Headings
    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-3 mb-2" {...props} />,
    // Blockquotes
    blockquote: ({ node, ...props }) => <blockquote className="mt-2 border-l-2 pl-4 italic text-muted-foreground" {...props} />,
    // Horizontal Rule
    hr: ({ node, ...props }) => <hr className="my-4 border-border/50" {...props} />,
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
} 