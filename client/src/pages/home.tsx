import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/ui/navigation";
import IssueUpload from "@/components/ui/issue-upload";
import DashboardStats from "@/components/ui/dashboard-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const { user } = useAuth();

  const { data: recentIssues, isLoading: issuesLoading } = useQuery({
    queryKey: ["/api/issues", "recent"],
    enabled: !!user,
  });

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
    enabled: !!user,
  });

  const { data: recentPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts", "recent"],
    enabled: !!user,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-welcome">
                Welcome back, {(user as any)?.firstName || 'Citizen'}
              </h1>
              <p className="text-gray-600 mt-1">
                Report and track civic issues in your community
              </p>
            </div>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
              data-testid="button-report-issue"
            >
              <i className="fas fa-plus mr-2"></i>
              Report Issue
            </Button>
          </div>
        </div>
      </div>

      {/* Issue Upload Section */}
      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <IssueUpload />
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900" data-testid="text-dashboard-title">Dashboard Overview</h2>
          </div>

          {/* Stats Cards */}
          <DashboardStats stats={dashboardStats} isLoading={statsLoading} />

          {/* Recent Reports and Community Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Recent Reports */}
            <Card data-testid="card-recent-reports">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-file-alt mr-2 text-primary"></i>
                  Recent Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {issuesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentIssues?.length ? (
                  <div className="space-y-4">
                    {recentIssues.slice(0, 5).map((issue: any) => (
                      <div key={issue.id} className="flex items-start justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors" data-testid={`report-${issue.id}`}>
                        <div className="flex items-start space-x-3">
                          {issue.imageUrl && (
                            <img 
                              src={issue.imageUrl} 
                              alt="Issue"
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900" data-testid={`report-title-${issue.id}`}>
                              {issue.title}
                            </p>
                            <p className="text-sm text-gray-500" data-testid={`report-description-${issue.id}`}>
                              {issue.description?.substring(0, 100)}...
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              <i className="fas fa-map-marker-alt mr-1"></i>
                              {issue.address}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge className={getStatusColor(issue.status)} data-testid={`report-status-${issue.id}`}>
                            {issue.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(issue.priority)} data-testid={`report-priority-${issue.id}`}>
                            {issue.priority}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-inbox text-4xl mb-4"></i>
                    <p>No reports yet. Start by reporting your first issue!</p>
                  </div>
                )}
                
                {recentIssues?.length > 5 && (
                  <div className="mt-6 text-center">
                    <Button variant="link" className="text-primary" data-testid="button-view-all-reports">
                      View all reports →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Community Activity */}
            <Card data-testid="card-community-activity">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-users mr-2 text-secondary"></i>
                  Community Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentPosts?.length ? (
                  <div className="space-y-4">
                    {recentPosts.slice(0, 5).map((post: any) => (
                      <div key={post.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors" data-testid={`post-${post.id}`}>
                        <img 
                          src={post.author.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32"} 
                          alt={post.author.firstName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900" data-testid={`post-author-${post.id}`}>
                              {post.author.firstName} {post.author.lastName}
                            </p>
                            {post.isOfficial && (
                              <Badge className="bg-blue-100 text-blue-800">
                                <i className="fas fa-check-circle mr-1"></i>
                                Official
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2" data-testid={`post-content-${post.id}`}>
                            {post.content}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                            <button className="flex items-center hover:text-primary">
                              <i className="far fa-thumbs-up mr-1"></i>
                              {post.likesCount}
                            </button>
                            <button className="flex items-center hover:text-primary">
                              <i className="far fa-comment mr-1"></i>
                              {post.commentsCount}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-comments text-4xl mb-4"></i>
                    <p>No recent community activity.</p>
                  </div>
                )}

                {recentPosts?.length > 5 && (
                  <div className="mt-6 text-center">
                    <Button variant="link" className="text-primary" data-testid="button-view-community">
                      View community →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
