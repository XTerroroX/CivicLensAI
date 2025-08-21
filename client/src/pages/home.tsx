import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import IssueUpload from "@/components/ui/issue-upload";
import DashboardStats from "@/components/ui/dashboard-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Plus, TrendingUp, MapPin, Clock } from "lucide-react";

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
      case "pending": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "assigned": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "in_progress": return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      case "resolved": return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "closed": return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      default: return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "medium": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "high": return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      case "urgent": return "bg-red-500/10 text-red-700 dark:text-red-400";
      default: return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-welcome">
              Welcome back, {(user as any)?.firstName || 'Citizen'}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Help make your community better by reporting civic issues with AI-powered assistance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2" data-testid="button-report-issue">
                <Plus className="h-5 w-5" />
                Report New Issue
              </Button>
              <Button variant="outline" size="lg" className="gap-2">
                <TrendingUp className="h-5 w-5" />
                View Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Issue Upload Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <IssueUpload />
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">Dashboard Overview</h2>
            <p className="text-muted-foreground mt-2">Track your reports and community activity</p>
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
                      <div key={issue.id} className="flex items-start justify-between p-4 hover:bg-accent rounded-lg transition-colors" data-testid={`report-${issue.id}`}>
                        <div className="flex items-start space-x-3">
                          {issue.imageUrl && (
                            <img 
                              src={issue.imageUrl} 
                              alt="Issue"
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-foreground" data-testid={`report-title-${issue.id}`}>
                              {issue.title}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`report-description-${issue.id}`}>
                              {issue.description?.substring(0, 100)}...
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
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
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
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
