import { LucideProps, LayoutDashboard, BarChart3, Settings, Cpu, Languages, Book, BookOpen } from 'lucide-react';

// Replace with actual SVG icons or components
const Google = (props: LucideProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    {/* Placeholder Google Icon Path */}
    <path fill="currentColor" d="M21.35 11.1h-9.1v2.7h5.1c-.6 1.7-2.3 2.9-4.5 2.9-2.7 0-4.9-2.2-4.9-4.9s2.2-4.9 4.9-4.9c1.2 0 2.3.4 3.2 1.1l2.1-2.1c-1.9-1.8-4.4-2.9-7.2-2.9-5.4 0-9.8 4.4-9.8 9.8s4.4 9.8 9.8 9.8c5.6 0 9.6-3.8 9.6-9.4 0-.7-.1-1.4-.2-2.1z" />
  </svg>
);

const Apple = (props: LucideProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    {/* Placeholder Apple Icon Path */}
    <path fill="currentColor" d="M19.8 14.1c-.1 2.1-1.8 3.9-3.8 4.2-.8.1-1.6-.2-2.3-.6-.9-.5-1.9-1.1-3.1-1.1-1.2 0-2.1.6-3 .9-.9.5-1.9.9-2.9.9-1.9 0-3.7-1.2-4.6-2.9-.9-1.8-.4-3.8.9-5.2 1.3-1.4 3.3-2.3 5.1-2.3.8 0 1.6.2 2.3.5.8.4 1.6.9 2.5.9.9 0 1.7-.4 2.5-.9.8-.3 1.6-.5 2.4-.5 1.1 0 2.1.4 2.9 1.1-.1-.1 0 0 0 0zm-5.4-8.1c.9-1.1 1.4-2.5 1.2-3.9-.9.1-2.2.7-3.1 1.7-.9 1-1.6 2.5-1.4 3.8.9-.1 2.2-.6 3.3-1.6z" />
  </svg>
);

const Dashboard = (props: LucideProps) => (
  <LayoutDashboard {...props} />
);

const Analytics = (props: LucideProps) => (
  <BarChart3 {...props} />
);

const SettingsIcon = (props: LucideProps) => (
  <Settings {...props} />
);

const LanguagesIcon = (props: LucideProps) => (
  <Languages {...props} />
);

const BookIcon = (props: LucideProps) => (
  <Book {...props} />
);

const BookOpenIcon = (props: LucideProps) => (
  <BookOpen {...props} />
);

export const Icons = {
  google: Google,
  apple: Apple,
  dashboard: Cpu,
  analytics: Analytics,
  settings: SettingsIcon,
  languages: LanguagesIcon,
  book: BookIcon,
  library: BookOpenIcon,
}; 