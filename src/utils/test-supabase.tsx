'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { UserLearningSession, UserSessionEvent } from '@/types/learning';

export default function TestSupabase() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<UserLearningSession[]>([]);
  const [events, setEvents] = useState<UserSessionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Get current user
  useEffect(() => {
    async function getUserId() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);
      } catch (err) {
        setError('Failed to get user ID');
        console.error(err);
      }
    }

    getUserId();
  }, []);

  // Function to create a test session
  async function createTestSession() {
    if (!userId) {
      setError('User not logged in');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a test session
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_learning_sessions')
        .insert({
          user_id: userId,
          module_id: 'test-module',
          target_language: 'de',
          source_language: 'en',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create a test event
      const { error: eventError } = await supabase
        .from('user_session_events')
        .insert({
          session_id: sessionData.id,
          submodule_id: 'test-submodule',
          modal_id: 'reading',
          flavour_id: 'multiple-choice',
          question_data: { 
            question: 'Test question', 
            options: ['A', 'B', 'C'] 
          },
          user_answer: { answer: 'A' },
          mark_data: { isCorrect: true, score: 100 },
          is_correct: true,
        });

      if (eventError) throw eventError;

      // Fetch updated data
      await fetchData();
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  // Function to fetch sessions and events
  async function fetchData() {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_learning_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (sessionError) throw sessionError;
      setSessions(sessionData || []);

      // Get events if there are sessions
      if (sessionData && sessionData.length > 0) {
        const { data: eventData, error: eventError } = await supabase
          .from('user_session_events')
          .select('*')
          .in('session_id', sessionData.map(s => s.id))
          .order('timestamp', { ascending: false });

        if (eventError) throw eventError;
        setEvents(eventData || []);
      }
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  // Load data on component mount
  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Supabase Table Test</h1>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <p>User ID: {userId || 'Not logged in'}</p>
        <div className="space-x-4">
          <Button 
            onClick={createTestSession} 
            disabled={isLoading || !userId}
          >
            Create Test Session
          </Button>
          <Button 
            onClick={fetchData} 
            disabled={isLoading || !userId}
            variant="outline"
          >
            Refresh Data
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Sessions ({sessions.length})</h2>
        {sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Module</th>
                  <th className="p-2 border">Languages</th>
                  <th className="p-2 border">Created</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={session.id}>
                    <td className="p-2 border">
                      {session.id.substring(0, 8)}...
                    </td>
                    <td className="p-2 border">{session.module_id}</td>
                    <td className="p-2 border">
                      {session.source_language} → {session.target_language}
                    </td>
                    <td className="p-2 border">
                      {new Date(session.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No sessions found</p>
        )}
        
        <h2 className="text-xl font-semibold">Events ({events.length})</h2>
        {events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Session ID</th>
                  <th className="p-2 border">Submodule</th>
                  <th className="p-2 border">Modal</th>
                  <th className="p-2 border">Correct</th>
                  <th className="p-2 border">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id}>
                    <td className="p-2 border">
                      {event.session_id.substring(0, 8)}...
                    </td>
                    <td className="p-2 border">{event.submodule_id}</td>
                    <td className="p-2 border">{event.modal_id}</td>
                    <td className="p-2 border">
                      {event.is_correct ? 'Yes' : 'No'}
                    </td>
                    <td className="p-2 border">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No events found</p>
        )}
      </div>
    </div>
  );
} 