"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReadingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to streaming version as default
    router.replace('/reading/streaming');
  }, [router]);

  return (
    <div className="max-w-4xl mx-auto p-6 text-center">
      <div className="animate-pulse">
        <p className="text-muted-foreground">Redirecting to reading practice...</p>
      </div>
    </div>
  );
} 