import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";

interface Issue {
  id: string;
  title: string;
  description: string;
  issueType: string;
  priority: string;
  status: string;
  address: string;
  imageUrl?: string;
  reporter?: {
    firstName: string;
    lastName: string;
  };
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
  department?: string;
  createdAt: string;
  aiConfidence?: number;
}

interface IssueTableProps {
  issues?: Issue[];
  isLoading: boolean;
  showOfficialActions?: boolean;
}

export default function IssueTable({ issues, isLoading, showOfficialActions = false }: IssueTableProps) {
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

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

  const getIssueTypeColor = (type: string) => {
    switch (type) {
      case "pothole": return "bg-orange-100 text-orange-800";
      case "graffiti": return "bg-purple-100 text-purple-800";
      case "streetlight": return "bg-yellow-100 text-yellow-800";
      case "trash_overflow": return "bg-green-100 text-green-800";
      case "sidewalk_damage": return "bg-blue-100 text-blue-800";
      case "traffic_sign": return "bg-red-100 text-red-800";
      case "water_leak": return "bg-cyan-100 text-cyan-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const toggleIssueSelection = (issueId: string) => {
    setSelectedIssues(prev => 
      prev.includes(issueId) 
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIssues.length === issues?.length) {
      setSelectedIssues([]);
    } else {
      setSelectedIssues(issues?.map(issue => issue.id) || []);
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="card-issue-table-loading">
        <CardHeader>
          <CardTitle>Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-16 h-6 bg-gray-200 rounded"></div>
                    <div className="w-16 h-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!issues || issues.length === 0) {
    return (
      <Card data-testid="card-issue-table-empty">
        <CardContent className="text-center py-12">
          <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Issues Found</h3>
          <p className="text-gray-500">No issues match your current filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-issue-table">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            Issue Queue
            {showOfficialActions && selectedIssues.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedIssues.length} selected
              </Badge>
            )}
          </CardTitle>
          {showOfficialActions && (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" data-testid="button-bulk-assign">
                <i className="fas fa-user-plus mr-2"></i>Bulk Assign
              </Button>
              <Button variant="outline" size="sm" data-testid="button-bulk-update">
                <i className="fas fa-edit mr-2"></i>Bulk Update
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {showOfficialActions && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Checkbox
                      checked={selectedIssues.length === issues.length && issues.length > 0}
                      onCheckedChange={toggleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {showOfficialActions && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50" data-testid={`issue-row-${issue.id}`}>
                  {showOfficialActions && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Checkbox
                        checked={selectedIssues.includes(issue.id)}
                        onCheckedChange={() => toggleIssueSelection(issue.id)}
                        data-testid={`checkbox-issue-${issue.id}`}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {issue.imageUrl && (
                        <img 
                          src={issue.imageUrl} 
                          alt="Issue"
                          className="h-10 w-10 rounded-lg object-cover mr-3"
                          data-testid={`issue-image-${issue.id}`}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900" data-testid={`issue-title-${issue.id}`}>
                          {issue.title}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate" data-testid={`issue-description-${issue.id}`}>
                          {issue.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          {issue.address}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getIssueTypeColor(issue.issueType)} data-testid={`issue-type-${issue.id}`}>
                      <i className={`${getIssueTypeIcon(issue.issueType)} mr-1`}></i>
                      {issue.issueType.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getPriorityColor(issue.priority)} data-testid={`issue-priority-${issue.id}`}>
                      {issue.priority}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusColor(issue.status)} data-testid={`issue-status-${issue.id}`}>
                      {issue.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  {showOfficialActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {issue.assignedTo ? (
                        <span data-testid={`issue-assignee-${issue.id}`}>
                          {issue.assignedTo.firstName} {issue.assignedTo.lastName}
                          {issue.department && (
                            <div className="text-xs text-gray-400">
                              {issue.department.replace('_', ' ')}
                            </div>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div data-testid={`issue-created-${issue.id}`}>
                      {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                    </div>
                    {issue.reporter && (
                      <div className="text-xs text-gray-400">
                        by {issue.reporter.firstName} {issue.reporter.lastName}
                      </div>
                    )}
                    {issue.aiConfidence && (
                      <div className="text-xs text-blue-600">
                        AI: {issue.aiConfidence}% confidence
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                        data-testid={`button-view-${issue.id}`}
                      >
                        <i className="fas fa-eye"></i>
                      </Button>
                      {showOfficialActions && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-gray-600"
                            data-testid={`button-edit-${issue.id}`}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-gray-600"
                            data-testid={`button-assign-${issue.id}`}
                          >
                            <i className="fas fa-user-plus"></i>
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
