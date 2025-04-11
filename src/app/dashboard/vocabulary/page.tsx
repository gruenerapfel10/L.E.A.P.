import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VocabularyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vocabulary</h1>
        <p className="text-muted-foreground">
          Build and manage your vocabulary collection
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>My Words</CardTitle>
            <CardDescription>View and manage your saved words</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your personal collection of words will appear here. Start adding words to build your vocabulary!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Practice</CardTitle>
            <CardDescription>Test your knowledge</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Practice your vocabulary through various exercises and quizzes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>Track your learning</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Monitor your vocabulary growth and see your improvement over time.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 