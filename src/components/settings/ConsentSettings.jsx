import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useNoi } from '@/components/core/NoiContext';
import { toast } from 'sonner';

export default function ConsentSettings() {
  const { consent, setConsent } = useNoi();
  const [updating, setUpdating] = useState(null);

  const handleToggle = async (field, value) => {
    setUpdating(field);
    try {
      await setConsent({ [field]: value });
      toast.success('Privacy settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setUpdating(null);
    }
  };

  if (!consent) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="border-blue-500/50 bg-blue-500/10">
        <ShieldCheck className="w-4 h-4 text-blue-500" />
        <AlertDescription className="text-blue-200">
          You have full control over how Noi uses your data. All settings default to off for maximum privacy.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Privacy & Consent Settings</CardTitle>
          <CardDescription>
            Choose what data you're comfortable sharing and which features you'd like to use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Work Event Tracking */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-border">
            <div className="flex-1 space-y-1">
              <Label htmlFor="work-events" className="text-base font-medium">
                Work Event Analytics
              </Label>
              <p className="text-sm text-muted-foreground">
                Track work events like task completions and meeting attendance to provide insights and patterns.
                This helps Noi understand your work rhythm but is entirely optional.
              </p>
            </div>
            <Switch
              id="work-events"
              checked={consent.allow_work_event_tracking}
              onCheckedChange={(checked) => handleToggle('allow_work_event_tracking', checked)}
              disabled={updating === 'allow_work_event_tracking'}
            />
          </div>

          {/* Inbox AI */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-border">
            <div className="flex-1 space-y-1">
              <Label htmlFor="inbox-ai" className="text-base font-medium">
                AI-Powered Inbox Processing
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow AI to analyze inbox items, extract action items, and suggest priorities.
                Your inbox content is only processed when you choose to use this feature.
              </p>
            </div>
            <Switch
              id="inbox-ai"
              checked={consent.allow_inbox_ai}
              onCheckedChange={(checked) => handleToggle('allow_inbox_ai', checked)}
              disabled={updating === 'allow_inbox_ai'}
            />
          </div>

          {/* Learning Recommendations */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-border">
            <div className="flex-1 space-y-1">
              <Label htmlFor="learning-ai" className="text-base font-medium">
                Personalized Learning Recommendations
              </Label>
              <p className="text-sm text-muted-foreground">
                Let AI suggest relevant learning modules based on your work patterns and friction signals.
                This helps tailor your learning path but requires analyzing your work data.
              </p>
            </div>
            <Switch
              id="learning-ai"
              checked={consent.allow_learning_recommendations}
              onCheckedChange={(checked) => handleToggle('allow_learning_recommendations', checked)}
              disabled={updating === 'allow_learning_recommendations'}
            />
          </div>

          {/* Team Aggregates */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="team-data" className="text-base font-medium">
                Include in Team Metrics
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow your aggregated work metrics to be included in team-level analytics visible to managers.
                Your individual tasks, notes, and details remain private—only high-level metrics like capacity are shared.
              </p>
            </div>
            <Switch
              id="team-data"
              checked={consent.allow_team_aggregates}
              onCheckedChange={(checked) => handleToggle('allow_team_aggregates', checked)}
              disabled={updating === 'allow_team_aggregates'}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Your privacy matters.</strong> These settings can be changed at any time. Noi is designed to work
            with minimal data—core features like task management and calendar work regardless of these settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}