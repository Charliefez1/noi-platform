import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Target, Clock, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AILearningRecommendations({ user, tasks, goals, frictionIndex, capacityScore }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      // Analyze skill gaps from tasks
      const taskCategories = tasks.map(t => t.category).filter(Boolean);
      const deferredTasks = tasks.filter(t => t.deferred_count > 0);
      const highFrictionAreas = deferredTasks.map(t => t.category).filter(Boolean);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a learning advisor. Analyze this user's work profile and identify skill gaps:

        Friction Index: ${frictionIndex}%
        Capacity: ${capacityScore}%
        Deferred tasks: ${deferredTasks.length}
        High friction areas: ${highFrictionAreas.join(', ') || 'None'}
        Active goals: ${goals.map(g => g.name).join(', ') || 'None'}

        Identify 3 specific skill gaps and recommend micro-learning for each. For each recommendation:
        1. Skill gap identified
        2. Impact on their metrics
        3. Recommended learning module title
        4. Expected outcome`,
        response_json_schema: {
          type: "object",
          properties: {
            gaps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill_gap: { type: "string" },
                  impact: { type: "string" },
                  module_title: { type: "string" },
                  expected_outcome: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] }
                }
              }
            }
          }
        }
      });

      setRecommendations(result.gaps || []);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to analyze skill gaps');
    } finally {
      setLoading(false);
    }
  };

  const priorityColors = {
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    low: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Skills Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              Get personalized learning recommendations based on your work patterns
            </p>
            <Button onClick={generateRecommendations} disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze My Skills'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 bg-background rounded-lg border border-border space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">{rec.skill_gap}</span>
                  </div>
                  <Badge className={priorityColors[rec.priority]}>
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Impact:</strong> {rec.impact}
                </p>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs font-medium text-primary mb-1">
                    <ArrowRight className="w-3 h-3 inline mr-1" />
                    {rec.module_title}
                  </p>
                  <p className="text-xs text-muted-foreground">{rec.expected_outcome}</p>
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={generateRecommendations}
              disabled={loading}
            >
              Refresh Recommendations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}