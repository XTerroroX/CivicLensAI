import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/ui/navigation";
import IssueTable from "@/components/ui/issue-table";
import DashboardStats from "@/components/ui/dashboard-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";

export default function OfficialDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({
    status: "",
    department: "",
    priority: "",
    page: 1,
  });

  // Redirect to home if not authorized
  useEffect(() => {
    if (!authLoading && user && user.role !== "official" && user.role !== "admin") {
      toast({
        title: "Unauthorized",
        description: "You need official access to view this page.",
        variant: "destructive",
      });
      window.location.href = "/";
    }
  }, [user, authLoading, toast]);

  const { data: issues, isLoading: issuesLoading } = useQuery({
    queryKey: ["/api/issues", filters],
    enabled: !!user && (user.role === "official" || user.role === "admin"),
  });

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
    enabled: !!user && (user.role === "official" || user.role === "admin"),
  });

  const { data: issueStats } = useQuery({
    queryKey: ["/api/analytics/issue-stats", { department: user?.department }],
    enabled: !!user && (user.role === "official" || user.role === "admin"),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { issueIds: string[], status: string, assignedToId?: string }) => {
      // For demo purposes, update each issue individually
      await Promise.all(
        data.issueIds.map(id => 
          apiRequest("PATCH", `/api/issues/${id}/status`, {
            status: data.status,
            assignedToId: data.assignedToId,
          })
        )
      );
    },
    onSuccess: () => {
      toast({
        title: "Bulk Update Complete",
        description: "Selected issues have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update issues: " + error.message,
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "official" && user.role !== "admin")) {
    return null; // Will redirect via useEffect
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "assigned": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-orange-100 text-orange-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "urgent": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-official-dashboard-title">
              Official Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and track civic issue resolution for {user.department ? user.department.replace('_', ' ') : 'all departments'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className="bg-blue-100 text-blue-800" data-testid="badge-official">
              <i className="fas fa-shield-alt mr-1"></i>
              Official Access
            </Badge>
            <Button variant="outline" size="sm" data-testid="button-settings">
              <i className="fas fa-cog mr-2"></i>Settings
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats stats={dashboardStats} isLoading={statsLoading} />

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="queue" className="mt-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="queue" data-testid="tab-issue-queue">Issue Queue</TabsTrigger>
            <TabsTrigger value="assignments" data-testid="tab-assignments">My Assignments</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-department-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
          </TabsList>

          {/* Issue Queue Tab */}
          <TabsContent value="queue" className="space-y-6">
            {/* Department Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={filters.department === "" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters({...filters, department: ""})}
                data-testid="filter-all-departments"
              >
                All Departments
              </Button>
              <Button 
                variant={filters.department === "public_works" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters({...filters, department: "public_works"})}
                data-testid="filter-public-works"
              >
                Public Works
              </Button>
              <Button 
                variant={filters.department === "sanitation" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters({...filters, department: "sanitation"})}
                data-testid="filter-sanitation"
              >
                Sanitation
              </Button>
              <Button 
                variant={filters.department === "transportation" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters({...filters, department: "transportation"})}
                data-testid="filter-transportation"
              >
                Transportation
              </Button>
              <Button 
                variant={filters.department === "electrical" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters({...filters, department: "electrical"})}
                data-testid="filter-electrical"
              >
                Electrical
              </Button>
            </div>

            {/* Filters and Actions */}
            <Card data-testid="card-queue-controls">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4">
                    <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                      <SelectTrigger className="w-40" data-testid="select-status-filter">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
                      <SelectTrigger className="w-40" data-testid="select-priority-filter">
                        <SelectValue placeholder="Filter by priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Priorities</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" data-testid="button-bulk-actions">
                      <i className="fas fa-plus mr-2"></i>Bulk Actions
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-export-queue">
                      <i className="fas fa-download mr-2"></i>Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issue Table */}
            <IssueTable 
              issues={issues} 
              isLoading={issuesLoading}
              showOfficialActions={true}
            />
          </TabsContent>

          {/* My Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <Card data-testid="card-my-assignments">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-user-check mr-2 text-primary"></i>
                  My Assigned Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <IssueTable 
                  issues={issues?.filter((issue: any) => issue.assignedToId === user.id)} 
                  isLoading={issuesLoading}
                  showOfficialActions={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card data-testid="card-resolution-rate">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {issueStats?.resolved && issueStats?.total 
                      ? Math.round((issueStats.resolved / issueStats.total) * 100)
                      : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Resolution Rate</div>
                  <div className="text-xs text-green-600 mt-1">+5% from last month</div>
                </CardContent>
              </Card>

              <Card data-testid="card-avg-response-time">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {dashboardStats?.avgResponseTime || 0}
                  </div>
                  <div className="text-sm text-gray-600">Avg Response (days)</div>
                  <div className="text-xs text-blue-600 mt-1">-0.3 days improvement</div>
                </CardContent>
              </Card>

              <Card data-testid="card-backlog">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {(issueStats?.pending || 0) + (issueStats?.inProgress || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Current Backlog</div>
                  <div className="text-xs text-orange-600 mt-1">
                    {issueStats?.pending || 0} pending, {issueStats?.inProgress || 0} in progress
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Department Performance */}
            <Card data-testid="card-department-performance">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-chart-bar mr-2 text-primary"></i>
                  Department Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {issueStats?.byDepartment ? (
                  <div className="space-y-4">
                    {Object.entries(issueStats.byDepartment).map(([dept, count]) => (
                      <div key={dept} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-primary rounded-full"></div>
                          <span className="font-medium capitalize">{dept.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-bold">{count} issues</span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-primary rounded-full" 
                              style={{ width: `${(count / issueStats.total * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-chart-bar text-4xl mb-4"></i>
                    <p>No performance data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card data-testid="card-generate-reports">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-file-alt mr-2 text-primary"></i>
                  Generate Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Button variant="outline" className="h-24 flex-col" data-testid="button-weekly-report">
                    <i className="fas fa-calendar-week text-2xl mb-2"></i>
                    <span>Weekly Summary Report</span>
                  </Button>
                  
                  <Button variant="outline" className="h-24 flex-col" data-testid="button-monthly-report">
                    <i className="fas fa-calendar-alt text-2xl mb-2"></i>
                    <span>Monthly Performance Report</span>
                  </Button>
                  
                  <Button variant="outline" className="h-24 flex-col" data-testid="button-department-report">
                    <i className="fas fa-building text-2xl mb-2"></i>
                    <span>Department Analysis</span>
                  </Button>
                  
                  <Button variant="outline" className="h-24 flex-col" data-testid="button-citizen-feedback">
                    <i className="fas fa-comments text-2xl mb-2"></i>
                    <span>Citizen Feedback Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card data-testid="card-recent-reports">
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-file-pdf text-red-500"></i>
                      <span className="font-medium">Weekly Summary - Week 34</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>Generated 2 days ago</span>
                      <Button variant="ghost" size="sm">
                        <i className="fas fa-download"></i>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-file-excel text-green-500"></i>
                      <span className="font-medium">August Performance Data</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>Generated 1 week ago</span>
                      <Button variant="ghost" size="sm">
                        <i className="fas fa-download"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
