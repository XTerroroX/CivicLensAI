import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({
    status: "all",
    issueType: "all", 
    page: 1,
  });
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: "",
    comment: "",
    internalNotes: "",
    assignedToId: "",
  });

  const { data: issues, isLoading } = useQuery({
    queryKey: ["/api/issues", filters],
    enabled: !!user,
  });

  const { data: issueDetails } = useQuery({
    queryKey: ["/api/issues", selectedIssue?.id],
    enabled: !!selectedIssue?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/issues/${selectedIssue.id}/status`, data);
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Issue status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      setIsUpdateDialogOpen(false);
      setSelectedIssue(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update issue status: " + error.message,
        variant: "destructive",
      });
    },
  });

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

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case "pothole": return "fas fa-road";
      case "graffiti": return "fas fa-paint-brush";
      case "streetlight": return "fas fa-lightbulb";
      case "trash_overflow": return "fas fa-trash";
      case "sidewalk_damage": return "fas fa-walking";
      case "traffic_sign": return "fas fa-sign";
      case "water_leak": return "fas fa-tint";
      default: return "fas fa-exclamation-triangle";
    }
  };

  const canUpdateStatus = user?.role === "official" || user?.role === "admin";

  const handleStatusUpdate = () => {
    updateStatusMutation.mutate(statusUpdate);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-reports-title">
              {user?.role === "citizen" ? "My Reports" : "All Reports"}
            </h1>
            <p className="text-gray-600 mt-2">
              {user?.role === "citizen" 
                ? "Track and manage your submitted civic issue reports"
                : "Manage and respond to civic issue reports"
              }
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" data-testid="button-export">
              <i className="fas fa-download mr-2"></i>Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6" data-testid="card-filters">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.issueType} onValueChange={(value) => setFilters({...filters, issueType: value})}>
                <SelectTrigger data-testid="select-type-filter">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pothole">Pothole</SelectItem>
                  <SelectItem value="graffiti">Graffiti</SelectItem>
                  <SelectItem value="streetlight">Street Light</SelectItem>
                  <SelectItem value="trash_overflow">Trash Overflow</SelectItem>
                  <SelectItem value="sidewalk_damage">Sidewalk Damage</SelectItem>
                  <SelectItem value="traffic_sign">Traffic Sign</SelectItem>
                  <SelectItem value="water_leak">Water Leak</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => setFilters({ status: "all", issueType: "all", page: 1 })}
                data-testid="button-clear-filters"
              >
                <i className="fas fa-times mr-2"></i>Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Issues List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : issues?.length ? (
            issues.map((issue: any) => (
              <Card key={issue.id} className="hover:shadow-md transition-shadow" data-testid={`issue-card-${issue.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {issue.imageUrl && (
                        <img 
                          src={issue.imageUrl} 
                          alt="Issue"
                          className="w-16 h-16 rounded-lg object-cover"
                          data-testid={`issue-image-${issue.id}`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <i className={`${getIssueTypeIcon(issue.issueType)} text-gray-500`}></i>
                          <h3 className="text-lg font-semibold text-gray-900" data-testid={`issue-title-${issue.id}`}>
                            {issue.title}
                          </h3>
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2" data-testid={`issue-description-${issue.id}`}>
                          {issue.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center">
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {issue.address}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                          </span>
                          {issue.reporter && (
                            <span>
                              by {issue.reporter.firstName} {issue.reporter.lastName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 mb-3">
                          <Badge className={getStatusColor(issue.status)} data-testid={`issue-status-${issue.id}`}>
                            {issue.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(issue.priority)} data-testid={`issue-priority-${issue.id}`}>
                            {issue.priority}
                          </Badge>
                          {issue.aiConfidence && (
                            <Badge variant="outline">
                              AI: {issue.aiConfidence}% confidence
                            </Badge>
                          )}
                        </div>

                        {issue.assignedTo && (
                          <p className="text-sm text-gray-600">
                            <i className="fas fa-user mr-1"></i>
                            Assigned to: {issue.assignedTo.firstName} {issue.assignedTo.lastName} ({issue.department})
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedIssue(issue)}
                        data-testid={`button-view-details-${issue.id}`}
                      >
                        <i className="fas fa-eye mr-2"></i>View
                      </Button>
                      
                      {canUpdateStatus && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedIssue(issue);
                            setStatusUpdate({
                              status: issue.status,
                              comment: "",
                              internalNotes: "",
                              assignedToId: issue.assignedToId || "",
                            });
                            setIsUpdateDialogOpen(true);
                          }}
                          data-testid={`button-update-status-${issue.id}`}
                        >
                          <i className="fas fa-edit mr-2"></i>Update
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Issues Found</h3>
                <p className="text-gray-500">
                  {user?.role === "citizen" 
                    ? "You haven't reported any issues yet. Start by reporting your first issue!"
                    : "No issues match your current filters."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Issue Details Modal */}
        <Dialog open={!!selectedIssue && !isUpdateDialogOpen} onOpenChange={() => setSelectedIssue(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-issue-details">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <i className={`${getIssueTypeIcon(selectedIssue?.issueType)} mr-2`}></i>
                {selectedIssue?.title}
              </DialogTitle>
            </DialogHeader>
            
            {issueDetails && (
              <div className="space-y-6">
                {/* Issue Image */}
                {issueDetails.imageUrl && (
                  <div>
                    <img 
                      src={issueDetails.imageUrl} 
                      alt="Issue"
                      className="w-full max-w-md mx-auto rounded-lg"
                      data-testid="issue-detail-image"
                    />
                  </div>
                )}

                {/* Issue Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-gray-700" data-testid="issue-detail-description">
                      {issueDetails.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge className={getStatusColor(issueDetails.status)}>
                          {issueDetails.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Priority:</span>
                        <Badge className={getPriorityColor(issueDetails.priority)}>
                          {issueDetails.priority}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span>{issueDetails.issueType.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Department:</span>
                        <span>{issueDetails.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{formatDistanceToNow(new Date(issueDetails.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h4 className="font-semibold mb-2">Location</h4>
                  <p className="text-gray-700">
                    <i className="fas fa-map-marker-alt mr-2"></i>
                    {issueDetails.address}
                  </p>
                </div>

                {/* AI Analysis */}
                {issueDetails.aiAnalysis && (
                  <div>
                    <h4 className="font-semibold mb-2">AI Analysis</h4>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Confidence: {issueDetails.aiConfidence}%
                      </p>
                      <pre className="text-sm mt-2 text-blue-700 whitespace-pre-wrap">
                        {JSON.stringify(JSON.parse(issueDetails.aiAnalysis), null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Updates History */}
                {issueDetails.updates?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Update History</h4>
                    <div className="space-y-3">
                      {issueDetails.updates.map((update: any) => (
                        <div key={update.id} className="border-l-4 border-blue-200 pl-4 py-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {update.updateType.replace('_', ' ')}
                              </p>
                              {update.comment && (
                                <p className="text-gray-700 mt-1">{update.comment}</p>
                              )}
                              {update.oldStatus !== update.newStatus && (
                                <p className="text-sm text-gray-500">
                                  Status: {update.oldStatus} → {update.newStatus}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <p>{update.updatedBy.firstName} {update.updatedBy.lastName}</p>
                              <p>{formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Status Update Modal */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent data-testid="dialog-status-update">
            <DialogHeader>
              <DialogTitle>Update Issue Status</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select value={statusUpdate.status} onValueChange={(value) => setStatusUpdate({...statusUpdate, status: value})}>
                  <SelectTrigger data-testid="select-new-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Public Comment</label>
                <Textarea 
                  value={statusUpdate.comment}
                  onChange={(e) => setStatusUpdate({...statusUpdate, comment: e.target.value})}
                  placeholder="Add a comment visible to the reporter..."
                  data-testid="textarea-public-comment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Internal Notes (Officials Only)</label>
                <Textarea 
                  value={statusUpdate.internalNotes}
                  onChange={(e) => setStatusUpdate({...statusUpdate, internalNotes: e.target.value})}
                  placeholder="Add internal notes..."
                  data-testid="textarea-internal-notes"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)} data-testid="button-cancel-update">
                  Cancel
                </Button>
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={updateStatusMutation.isPending}
                  data-testid="button-save-update"
                >
                  {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
