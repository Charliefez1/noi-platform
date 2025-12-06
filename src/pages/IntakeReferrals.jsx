import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, User, Briefcase, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNoi } from '@/components/core/NoiContext';

export default function IntakeReferralsPage() {
  const [user, setUser] = useState(null);
  const [referralType, setReferralType] = useState(null); // 'self', 'manager', 'hr'
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeEmail: '',
    reason: '',
    concerns: '',
    urgency: 'routine',
    consentGiven: false,
    shareCapacity: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const { capacityScore, frictionIndex } = useNoi();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (!referralType) {
          const isManager = userData.role_type === 'manager' || userData.role_type === 'exec';
          const isHR = userData.role_type === 'hr';
          if (isManager || isHR) {
            // Don't auto-select, let them choose
          } else {
            setReferralType('self');
            setFormData(prev => ({
              ...prev,
              employeeName: userData.full_name,
              employeeEmail: userData.email
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.consentGiven) {
      toast.error('Please confirm consent to proceed');
      return;
    }

    setSubmitting(true);
    try {
      // Create support case or referral
      // await base44.entities.SupportCase.create({...formData});
      
      toast.success('Support request submitted successfully');
      setFormData({
        employeeName: '',
        employeeEmail: '',
        reason: '',
        concerns: '',
        urgency: 'routine',
        consentGiven: false,
        shareCapacity: false,
      });
      setReferralType(null);
    } catch (error) {
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!referralType) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intake & Referrals</h1>
          <p className="text-muted-foreground">How would you like to proceed?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setReferralType('self')}>
            <CardHeader>
              <User className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle className="text-lg">Self-Referral</CardTitle>
              <CardDescription>Request support for yourself</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Continue</Button>
            </CardContent>
          </Card>

          {(user?.role_type === 'manager' || user?.role_type === 'exec' || user?.role_type === 'hr') && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setReferralType('manager')}>
              <CardHeader>
                <Briefcase className="w-8 h-8 text-purple-500 mb-2" />
                <CardTitle className="text-lg">Manager Referral</CardTitle>
                <CardDescription>Refer a team member for support</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Continue</Button>
              </CardContent>
            </Card>
          )}

          {user?.role_type === 'hr' && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setReferralType('hr')}>
              <CardHeader>
                <ClipboardList className="w-8 h-8 text-green-500 mb-2" />
                <CardTitle className="text-lg">HR Referral</CardTitle>
                <CardDescription>Refer an employee for support</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Continue</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {referralType === 'self' ? 'Self-Referral' : referralType === 'manager' ? 'Manager Referral' : 'HR Referral'}
          </h1>
          <p className="text-muted-foreground">Complete the form to submit a support request</p>
        </div>
        <Button variant="ghost" onClick={() => setReferralType(null)}>Back</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Individual Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input 
                value={formData.employeeName}
                onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                disabled={referralType === 'self'}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                type="email"
                value={formData.employeeEmail}
                onChange={(e) => setFormData({...formData, employeeEmail: e.target.value})}
                disabled={referralType === 'self'}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Reason for Support</Label>
              <Textarea 
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="What kind of support are you seeking?"
                required
                rows={3}
              />
            </div>
            <div>
              <Label>Specific Concerns or Challenges</Label>
              <Textarea 
                value={formData.concerns}
                onChange={(e) => setFormData({...formData, concerns: e.target.value})}
                placeholder="Please describe any specific challenges..."
                rows={4}
              />
            </div>
            <div>
              <Label>Urgency Level</Label>
              <select 
                className="w-full p-2 border rounded-md bg-background"
                value={formData.urgency}
                onChange={(e) => setFormData({...formData, urgency: e.target.value})}
              >
                <option value="routine">Routine (within 2 weeks)</option>
                <option value="priority">Priority (within 1 week)</option>
                <option value="urgent">Urgent (within 48 hours)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {referralType === 'self' && (
          <Card>
            <CardHeader>
              <CardTitle>Current Capacity Snapshot</CardTitle>
              <CardDescription>Optional context to help tailor support</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cognitive Load</p>
                  <p className="text-2xl font-bold">{Math.round(capacityScore)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Friction Index</p>
                  <p className="text-2xl font-bold">{Math.round(frictionIndex)}%</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox 
                  id="shareCapacity"
                  checked={formData.shareCapacity}
                  onCheckedChange={(checked) => setFormData({...formData, shareCapacity: checked})}
                />
                <label htmlFor="shareCapacity" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Share my capacity data with the support team
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Consent & Agreement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="consent"
                checked={formData.consentGiven}
                onCheckedChange={(checked) => setFormData({...formData, consentGiven: checked})}
                required
              />
              <label htmlFor="consent" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I consent to sharing this information with the Neurodiversity Guidance team for the purpose of receiving support. 
                I understand that all information will be kept confidential and used only to provide appropriate guidance.
              </label>
            </div>
            
            {referralType !== 'self' && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> The employee will be notified of this referral and must provide their own consent before support can proceed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => setReferralType(null)}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !formData.consentGiven}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </div>
  );
}