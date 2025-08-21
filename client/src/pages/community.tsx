import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({
    postType: "",
    isOfficial: "",
    page: 1,
  });
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    postType: "discussion",
    isOfficial: false,
  });
  const [newComment, setNewComment] = useState("");
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts", filters],
    enabled: !!user,
  });

  const { data: comments } = useQuery({
    queryKey: ["/api/comments", selectedPost?.id],
    enabled: !!selectedPost?.id,
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      return apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      toast({
        title: "Post Created",
        description: "Your post has been published successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewPost({ title: "", content: "", postType: "discussion", isOfficial: false });
      setIsCreatePostOpen(false);
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
        description: "Failed to create post: " + error.message,
        variant: "destructive",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (commentData: any) => {
      return apiRequest("POST", "/api/comments", commentData);
    },
    onSuccess: () => {
      toast({
        title: "Comment Added",
        description: "Your comment has been posted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/comments", selectedPost?.id] });
      setNewComment("");
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
        description: "Failed to add comment: " + error.message,
        variant: "destructive",
      });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("POST", "/api/engagement/like", { postId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
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
        description: "Failed to toggle like: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and content.",
        variant: "destructive",
      });
      return;
    }
    createPostMutation.mutate(newPost);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    createCommentMutation.mutate({
      content: newComment,
      postId: selectedPost.id,
    });
  };

  const canCreateOfficialPost = user?.role === "official" || user?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-community-title">
              Community Hub
            </h1>
            <p className="text-gray-600 mt-2">
              Connect with fellow citizens, stay updated on civic improvements, and participate in community discussions
            </p>
          </div>
          
          <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" data-testid="button-create-post">
                <i className="fas fa-plus mr-2"></i>
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" data-testid="dialog-create-post">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    placeholder="Enter post title..."
                    data-testid="input-post-title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <Textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    placeholder="What would you like to share with the community?"
                    rows={6}
                    data-testid="textarea-post-content"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Post Type</label>
                    <Select value={newPost.postType} onValueChange={(value) => setNewPost({...newPost, postType: value})}>
                      <SelectTrigger data-testid="select-post-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discussion">Discussion</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {canCreateOfficialPost && (
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="official-post"
                        checked={newPost.isOfficial}
                        onChange={(e) => setNewPost({...newPost, isOfficial: e.target.checked})}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        data-testid="checkbox-official-post"
                      />
                      <label htmlFor="official-post" className="text-sm font-medium">
                        Official Post
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreatePostOpen(false)} data-testid="button-cancel-post">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePost}
                    disabled={createPostMutation.isPending}
                    data-testid="button-publish-post"
                  >
                    {createPostMutation.isPending ? "Publishing..." : "Publish"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6" data-testid="card-filters">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filters.postType} onValueChange={(value) => setFilters({...filters, postType: value})}>
                <SelectTrigger data-testid="select-filter-type">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="discussion">Discussions</SelectItem>
                  <SelectItem value="announcement">Announcements</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.isOfficial} onValueChange={(value) => setFilters({...filters, isOfficial: value})}>
                <SelectTrigger data-testid="select-filter-official">
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Posts</SelectItem>
                  <SelectItem value="true">Official Only</SelectItem>
                  <SelectItem value="false">Community Only</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => setFilters({ postType: "all", isOfficial: "all", page: 1 })}
                data-testid="button-clear-filters"
              >
                <i className="fas fa-times mr-2"></i>Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Posts Feed */}
          <div className="lg:col-span-2 space-y-4">
            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-20 bg-gray-200 rounded w-full"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts?.length ? (
              posts.map((post: any) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow" data-testid={`post-card-${post.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <img 
                        src={post.author.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"} 
                        alt={post.author.firstName}
                        className="w-10 h-10 rounded-full object-cover"
                        data-testid={`post-author-avatar-${post.id}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900" data-testid={`post-author-name-${post.id}`}>
                            {post.author.firstName} {post.author.lastName}
                          </h4>
                          {post.isOfficial && (
                            <Badge className="bg-blue-100 text-blue-800" data-testid={`post-official-badge-${post.id}`}>
                              <i className="fas fa-check-circle mr-1"></i>
                              Official
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {post.postType}
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid={`post-title-${post.id}`}>
                          {post.title}
                        </h3>
                        
                        <p className="text-gray-700 mb-4" data-testid={`post-content-${post.id}`}>
                          {post.content}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                          <div className="flex items-center space-x-4">
                            <button 
                              className="flex items-center hover:text-primary transition-colors"
                              onClick={() => toggleLikeMutation.mutate(post.id)}
                              data-testid={`button-like-${post.id}`}
                            >
                              <i className="far fa-thumbs-up mr-1"></i>
                              <span>{post.likesCount}</span>
                            </button>
                            <button 
                              className="flex items-center hover:text-primary transition-colors"
                              onClick={() => setSelectedPost(post)}
                              data-testid={`button-comment-${post.id}`}
                            >
                              <i className="far fa-comment mr-1"></i>
                              <span>{post.commentsCount}</span>
                            </button>
                            <button className="hover:text-primary transition-colors">
                              <i className="fas fa-share"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <i className="fas fa-comments text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Posts Yet</h3>
                  <p className="text-gray-500">
                    Be the first to start a community discussion!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Community Sidebar */}
          <div className="space-y-6">
            {/* Community Stats */}
            <Card data-testid="card-community-stats">
              <CardHeader>
                <CardTitle className="text-lg">Community Impact</CardTitle>
              </CardHeader>
              <CardContent className="bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg p-6 -mt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Active Citizens</span>
                    <span className="font-bold">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Issues Resolved</span>
                    <span className="font-bold">892</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Avg Resolution Time</span>
                    <span className="font-bold">2.1 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card data-testid="card-recent-activity">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 text-sm">
                    <img 
                      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" 
                      alt="User"
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p><span className="font-medium">Sarah J.</span> reported a new issue</p>
                      <p className="text-gray-500">10 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 text-sm">
                    <img 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" 
                      alt="User"
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p><span className="font-medium">Mike R.</span> upvoted a pothole report</p>
                      <p className="text-gray-500">25 minutes ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-sm">
                    <img 
                      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" 
                      alt="User"
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p><span className="font-medium">Lisa K.</span> started a discussion</p>
                      <p className="text-gray-500">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comments Modal */}
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-post-comments">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <i className="fas fa-comments mr-2"></i>
                Comments
              </DialogTitle>
            </DialogHeader>
            
            {selectedPost && (
              <div className="space-y-6">
                {/* Original Post */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <img 
                      src={selectedPost.author.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"} 
                      alt={selectedPost.author.firstName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {selectedPost.author.firstName} {selectedPost.author.lastName}
                        </h4>
                        {selectedPost.isOfficial && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <i className="fas fa-check-circle mr-1"></i>
                            Official
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{selectedPost.title}</h3>
                      <p className="text-gray-700">{selectedPost.content}</p>
                    </div>
                  </div>
                </div>

                {/* Add Comment */}
                <div className="border-t pt-4">
                  <div className="flex space-x-3">
                    <img 
                      src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"} 
                      alt="You"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                        data-testid="textarea-new-comment"
                      />
                      <div className="flex justify-end mt-2">
                        <Button 
                          size="sm"
                          onClick={handleAddComment}
                          disabled={createCommentMutation.isPending || !newComment.trim()}
                          data-testid="button-add-comment"
                        >
                          {createCommentMutation.isPending ? "Adding..." : "Add Comment"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments?.length ? (
                    comments.map((comment: any) => (
                      <div key={comment.id} className="flex space-x-3" data-testid={`comment-${comment.id}`}>
                        <img 
                          src={comment.author.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"} 
                          alt={comment.author.firstName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm">{comment.author.firstName} {comment.author.lastName}</span>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-comment text-4xl mb-4"></i>
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
