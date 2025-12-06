import React from 'react';
import ConsentSettings from '@/components/settings/ConsentSettings';

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Privacy Settings</h1>
        <p className="text-muted-foreground">Control how Noi uses your data</p>
      </div>
      
      <ConsentSettings />
    </div>
  );
}