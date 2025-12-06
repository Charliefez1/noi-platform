import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Folder, Search, Calendar, User, AlertCircle } from 'lucide-react';

export default function CasesPage() {
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Fetch cases based on role
        // Employee: only their own cases
        // NDG: all cases they're assigned to
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isNDG = user?.role_type === 'ndg' || user?.role_type === 'sap';
  
  const filteredCases = cases.filter(c => 
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cases</h1>
          <p className="text-muted-foreground">
            {isNDG ? 'Manage and track all support cases' : 'View your support case'}
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search cases..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredCases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No cases found</p>
            {!isNDG && (
              <p className="text-sm text-muted-foreground mt-2">
                You don't have any active support cases
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={isNDG ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : ''}>
          {/* Cases List */}
          <div className={isNDG ? 'lg:col-span-1 space-y-3' : 'space-y-3'}>
            {filteredCases.map((caseItem) => (
              <Card 
                key={caseItem.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedCase?.id === caseItem.id ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedCase(caseItem)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base mb-1">{caseItem.title || 'Support Case'}</CardTitle>
                      {isNDG && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {caseItem.employee_name}
                        </p>
                      )}
                    </div>
                    <Badge variant={caseItem.status === 'open' ? 'default' : 'secondary'}>
                      {caseItem.status || 'Open'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {caseItem.created_date ? new Date(caseItem.created_date).toLocaleDateString() : 'N/A'}
                    </span>
                    {caseItem.next_session && (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Next: {new Date(caseItem.next_session).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Case Detail View (for NDG) */}
          {isNDG && selectedCase && (
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Case Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Case Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Employee:</span>
                        <span className="font-medium">{selectedCase.employee_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge>{selectedCase.status}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Opened:</span>
                        <span>{new Date(selectedCase.created_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Notes & Actions</h3>
                    <div className="bg-muted/50 rounded-lg p-4 text-sm">
                      <p className="text-muted-foreground">Case notes and actions will appear here</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Linked Resources</h3>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        View Journal Entries
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        View Alignment Plan
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1">Add Note</Button>
                    <Button variant="outline" className="flex-1">Schedule Session</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Employee Case Detail (non-NDG) */}
          {!isNDG && selectedCase && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Case Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge>{selectedCase.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Opened</p>
                  <p className="text-sm">{new Date(selectedCase.created_date).toLocaleDateString()}</p>
                </div>
                {selectedCase.next_session && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Next Session</p>
                    <p className="text-sm">{new Date(selectedCase.next_session).toLocaleDateString()}</p>
                  </div>
                )}
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    Your support case is being handled by the Neurodiversity Guidance team. 
                    They will reach out to schedule sessions and provide updates.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}