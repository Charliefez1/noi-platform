import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircleQuestion, Plus, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagerGuidancePage() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newRequest, setNewRequest] = useState({
    scenario: '',
    role_expectations: '',
    what_tried: '',
    support_needed: ''
  });
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Fetch guidance requests
        // Manager: their own requests
        // NDG: all pending requests
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const isNDG = user?.role_type === 'ndg' || user?.role_type === 'sap';
  const isManager = user?.role_type === 'manager' || user?.role_type === 'exec';
  const isAdmin = user?.role === 'admin';

  const handleSubmitRequest = async () => {
    if (!newRequest.scenario || !newRequest.support_needed) {
      toast.error('Please fill in scenario and support needed');
      return;
    }

    setSubmitting(true);
    try {
      // await base44.entities.GuidanceRequest.create({
      //   ...newRequest,
      //   manager_id: user.id,
      //   status: 'pending'
      // });
      
      toast.success('Guidance request submitted');
      setNewRequest({
        scenario: '',
        role_expectations: '',
        what_tried: '',
        support_needed: ''
      });
      setShowNewRequest(false);
    } catch (error) {
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      // await base44.entities.GuidanceReply.create({
      //   request_id: selectedRequest.id,
      //   reply_text: replyText,
      //   from_user_id: user.id
      // });
      
      toast.success('Reply sent');
      setReplyText('');
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isManager && !isNDG && !isAdmin) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageCircleQuestion className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Manager Guidance is only available to managers and NDG team members</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Guidance</h1>
          <p className="text-muted-foreground">
            {isNDG ? 'Respond to manager guidance requests' : 'Request support for challenging scenarios'}
          </p>
        </div>
        {(isManager || isAdmin) && (
          <Button onClick={() => setShowNewRequest(!showNewRequest)}>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        )}
      </div>

      {showNewRequest && (isManager || isAdmin) && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>New Guidance Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Scenario</label>
              <Textarea 
                placeholder="Describe the situation or challenge..."
                value={newRequest.scenario}
                onChange={(e) => setNewRequest({...newRequest, scenario: e.target.value})}
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Role Expectations</label>
              <Textarea 
                placeholder="What are the role requirements or expectations involved?"
                value={newRequest.role_expectations}
                onChange={(e) => setNewRequest({...newRequest, role_expectations: e.target.value})}
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">What I've Tried</label>
              <Textarea 
                placeholder="What approaches have you already attempted?"
                value={newRequest.what_tried}
                onChange={(e) => setNewRequest({...newRequest, what_tried: e.target.value})}
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Support Needed</label>
              <Textarea 
                placeholder="What kind of guidance would be most helpful?"
                value={newRequest.support_needed}
                onChange={(e) => setNewRequest({...newRequest, support_needed: e.target.value})}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowNewRequest(false)}>Cancel</Button>
              <Button onClick={handleSubmitRequest} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircleQuestion className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {isNDG ? 'No pending guidance requests' : 'You haven\'t submitted any guidance requests yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requests List */}
          <div className="lg:col-span-1 space-y-3">
            {requests.map((request) => (
              <Card 
                key={request.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedRequest?.id === request.id ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedRequest(request)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm">{request.scenario?.substring(0, 60)}...</CardTitle>
                    <Badge variant={request.status === 'pending' ? 'default' : 'secondary'}>
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.created_date).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Request Detail */}
          {selectedRequest && (
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Request Details</CardTitle>
                    <Badge variant={selectedRequest.status === 'pending' ? 'default' : 'secondary'}>
                      {selectedRequest.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Scenario</h4>
                    <p className="text-sm text-muted-foreground">{selectedRequest.scenario}</p>
                  </div>

                  {selectedRequest.role_expectations && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Role Expectations</h4>
                      <p className="text-sm text-muted-foreground">{selectedRequest.role_expectations}</p>
                    </div>
                  )}

                  {selectedRequest.what_tried && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">What's Been Tried</h4>
                      <p className="text-sm text-muted-foreground">{selectedRequest.what_tried}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Support Needed</h4>
                    <p className="text-sm text-muted-foreground">{selectedRequest.support_needed}</p>
                  </div>

                  {/* Thread/Replies would go here */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-3">Conversation</h4>
                    <div className="space-y-3 mb-4">
                      {/* Replies would be mapped here */}
                      <p className="text-sm text-muted-foreground">No replies yet</p>
                    </div>

                    {(isNDG || isAdmin) && (
                      <div className="flex gap-2">
                        <Textarea 
                          placeholder="Provide guidance..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={3}
                        />
                        <Button onClick={handleReply} disabled={submitting}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}