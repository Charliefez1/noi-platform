import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorBanner({ error, onRetry }) {
  if (!error) return null;

  return (
    <Alert className="border-red-500/50 bg-red-500/10">
      <AlertTriangle className="w-4 h-4 text-red-500" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-red-200">{error}</span>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="ml-4 border-red-500/50 hover:bg-red-500/20"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}