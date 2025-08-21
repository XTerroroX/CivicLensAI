import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { aiService } from "./aiService";
import { insertIssueSchema, insertPostSchema, insertCommentSchema, updateIssueStatusSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.dbUser?.id;
      const email = req.user?.claims?.email;
      
      if (!userId && !email) {
        return res.status(401).json({ message: "User ID or email not found" });
      }
      
      // First try to get from session
      if (req.user?.dbUser) {
        return res.json(req.user.dbUser);
      }
      
      // Try to get by user ID first, then fall back to email
      let user;
      if (userId) {
        user = await storage.getUser(userId);
      }
      if (!user && email) {
        user = await storage.getUserByEmail(email);
      }
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Object Storage Routes
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Issue Management Routes
  app.post("/api/issues", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.dbUser?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const validatedData = insertIssueSchema.parse(req.body);
      
      let aiAnalysis = null;
      let title = validatedData.title;
      let department = null;

      // If image is provided, analyze with AI
      if (validatedData.imageUrl) {
        try {
          // Convert image URL to base64 for AI analysis
          const response = await fetch(validatedData.imageUrl);
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          
          const analysis = await aiService.analyzeIssueImage(base64, validatedData.address || undefined);
          aiAnalysis = analysis;
          
          // Generate title if not provided
          if (!title || title.trim() === '') {
            title = await aiService.generateIssueTitle(analysis.issueType, analysis.description, validatedData.address || undefined);
          }
          
          // Determine department
          department = await aiService.classifyDepartment(analysis.issueType, analysis.description);
          
          // Update issue data with AI analysis
          validatedData.issueType = analysis.issueType;
          validatedData.priority = analysis.priority;
          if (!validatedData.description) {
            validatedData.description = analysis.description;
          }
        } catch (aiError) {
          console.error("AI analysis failed:", aiError);
          // Continue without AI analysis
        }
      }

      const issue = await storage.createIssue({
        ...validatedData,
        title,
        department,
        reporterId: userId,
      });

      // If image was uploaded, set ACL policy
      if (validatedData.imageUrl) {
        try {
          const objectStorageService = new ObjectStorageService();
          await objectStorageService.trySetObjectEntityAclPolicy(validatedData.imageUrl, {
            owner: userId,
            visibility: "private", // Issue images should be private by default
          });
        } catch (aclError) {
          console.error("Failed to set ACL policy:", aclError);
        }
      }

      res.status(201).json(issue);
    } catch (error) {
      console.error("Error creating issue:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create issue" });
    }
  });

  // Get all issues
  app.get("/api/issues", async (req, res) => {
    try {
      const issues = await storage.getAllIssues();
      res.json(issues);
    } catch (error) {
      console.error("Error fetching issues:", error);
      res.status(500).json({ error: "Failed to fetch issues" });
    }
  });

  // Get recent issues
  app.get("/api/issues/recent", async (req, res) => {
    try {
      const issues = await storage.getRecentIssues(5); // Get 5 most recent issues
      res.json(issues);
    } catch (error) {
      console.error("Error fetching recent issues:", error);
      res.status(500).json({ error: "Failed to fetch recent issues" });
    }
  });

  // Get filtered issues (this was the original route)
  app.get("/api/issues/filtered", async (req, res) => {
    try {
      const { status, issueType, department, page = "1", limit = "20" } = req.query;
      
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const issues = await storage.getIssues({
        status: status as string,
        issueType: issueType as string,
        department: department as string,
        limit: limitNum,
        offset,
      });

      res.json(issues);
    } catch (error) {
      console.error("Error fetching issues:", error);
      res.status(500).json({ error: "Failed to fetch issues" });
    }
  });

  app.get("/api/issues/:id", async (req, res) => {
    try {
      const issue = await storage.getIssue(req.params.id);
      if (!issue) {
        return res.status(404).json({ error: "Issue not found" });
      }
      res.json(issue);
    } catch (error) {
      console.error("Error fetching issue:", error);
      res.status(500).json({ error: "Failed to fetch issue" });
    }
  });

  app.patch("/api/issues/:id/status", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.dbUser?.id;
      const user = (req.user as any)?.dbUser;
      
      if (!user || (user.role !== "official" && user.role !== "admin")) {
        return res.status(403).json({ error: "Unauthorized - officials only" });
      }

      const validatedData = updateIssueStatusSchema.parse(req.body);
      
      const updatedIssue = await storage.updateIssueStatus(req.params.id, {
        ...validatedData,
        updatedById: userId,
      });

      res.json(updatedIssue);
    } catch (error) {
      console.error("Error updating issue status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update issue status" });
    }
  });

  app.get("/api/issues/location/:lat/:lng", async (req, res) => {
    try {
      const lat = parseFloat(req.params.lat);
      const lng = parseFloat(req.params.lng);
      const radius = parseFloat(req.query.radius as string) || 5;
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      const issues = await storage.getIssuesByLocation(lat, lng, radius);
      res.json(issues);
    } catch (error) {
      console.error("Error fetching issues by location:", error);
      res.status(500).json({ error: "Failed to fetch issues by location" });
    }
  });

  // Analytics Routes
  app.get("/api/analytics/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.dbUser?.id;
      const user = (req.user as any)?.dbUser;
      
      const stats = await storage.getDashboardStats(userId, user?.role);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/analytics/issue-stats", async (req, res) => {
    try {
      const { department, dateFrom, dateTo } = req.query;
      
      const filters: any = {};
      if (department) filters.department = department as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const stats = await storage.getIssueStats(filters);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching issue stats:", error);
      res.status(500).json({ error: "Failed to fetch issue stats" });
    }
  });

  // Community Routes
  app.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      console.log("Post creation - Full user object:", JSON.stringify(req.user, null, 2));
      
      const userId = (req.user as any)?.claims?.sub;
      console.log("Post creation - userId from claims:", userId);
      
      let user = await storage.getUser(userId);
      console.log("Post creation - user from storage:", user);
      
      if (!user) {
        // Try to create user if doesn't exist
        const claims = (req.user as any)?.claims;
        if (claims?.email) {
          user = await storage.upsertUser({
            email: claims.email,
            firstName: claims.first_name || claims.name?.split(' ')[0] || 'User',
            lastName: claims.last_name || claims.name?.split(' ')[1] || '',
            profileImageUrl: claims.profile_image_url || claims.picture,
          });
          console.log("Post creation - created new user:", user);
        } else {
          return res.status(401).json({ error: "User not found and cannot create" });
        }
      }
      
      // Use the database user ID
      const dbUserId = user?.id;
      console.log("Post creation - final dbUserId:", dbUserId);
      
      if (!dbUserId) {
        return res.status(500).json({ error: "Failed to get user ID" });
      }

      // Moderate content
      const moderation = await aiService.moderateContent(req.body.content);
      if (!moderation.isAppropriate) {
        return res.status(400).json({ 
          error: "Content flagged by moderation",
          categories: moderation.categories,
          suggestion: moderation.suggestion
        });
      }

      const validatedData = insertPostSchema.parse(req.body);
      
      // Only officials can create official posts
      if (validatedData.isOfficial && user.role !== "official" && user.role !== "admin") {
        return res.status(403).json({ error: "Only officials can create official posts" });
      }

      const post = await storage.createPost({
        ...validatedData,
        authorId: dbUserId,
        isOfficial: validatedData.isOfficial && (user.role === "official" || user.role === "admin"),
      });

      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.get("/api/posts", async (req, res) => {
    try {
      const { postType, isOfficial, page = "1", limit = "10" } = req.query;
      
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const posts = await storage.getPosts({
        postType: postType as string,
        isOfficial: isOfficial === "true",
        limit: limitNum,
        offset,
      });

      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.post("/api/comments", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.dbUser?.id;
      
      // Moderate content
      const moderation = await aiService.moderateContent(req.body.content);
      if (!moderation.isAppropriate) {
        return res.status(400).json({ 
          error: "Content flagged by moderation",
          categories: moderation.categories,
          suggestion: moderation.suggestion
        });
      }

      const validatedData = insertCommentSchema.parse(req.body);
      
      const comment = await storage.createComment({
        ...validatedData,
        authorId: userId,
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.get("/api/comments", async (req, res) => {
    try {
      const { postId, issueId, page = "1", limit = "20" } = req.query;
      
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const comments = await storage.getComments({
        postId: postId as string,
        issueId: issueId as string,
        limit: limitNum,
        offset,
      });

      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Engagement Routes
  app.post("/api/engagement/like", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.dbUser?.id;
      const { postId, issueId } = req.body;
      
      await storage.toggleLike(userId, postId, issueId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  app.get("/api/engagement/like", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.dbUser?.id;
      const { postId, issueId } = req.query;
      
      const isLiked = await storage.getUserEngagement(userId, postId as string, issueId as string);
      res.json({ isLiked });
    } catch (error) {
      console.error("Error checking engagement:", error);
      res.status(500).json({ error: "Failed to check engagement" });
    }
  });

  // AI Analysis Route (for testing)
  app.post("/api/ai/analyze-image", isAuthenticated, async (req, res) => {
    try {
      const { imageBase64, location } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "Image data required" });
      }

      const analysis = await aiService.analyzeIssueImage(imageBase64, location);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
