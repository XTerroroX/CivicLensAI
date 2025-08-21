import {
  users,
  issues,
  issueUpdates,
  posts,
  comments,
  userEngagement,
  type User,
  type UpsertUser,
  type Issue,
  type InsertIssue,
  type IssueUpdate,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type UpdateIssueStatus,
  type IssueWithDetails,
  type PostWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Issue operations
  createIssue(issue: InsertIssue & { reporterId: string }): Promise<Issue>;
  getIssue(id: string): Promise<IssueWithDetails | undefined>;
  getAllIssues(): Promise<IssueWithDetails[]>;
  getRecentIssues(limit?: number): Promise<IssueWithDetails[]>;
  getIssues(filters?: {
    status?: string;
    issueType?: string;
    department?: string;
    reporterId?: string;
    assignedToId?: string;
    limit?: number;
    offset?: number;
  }): Promise<IssueWithDetails[]>;
  updateIssueStatus(issueId: string, update: UpdateIssueStatus & { updatedById: string }): Promise<Issue>;
  getIssuesByLocation(lat: number, lng: number, radiusKm?: number): Promise<Issue[]>;
  getIssueStats(filters?: { department?: string; dateFrom?: Date; dateTo?: Date }): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    byType: Record<string, number>;
    byDepartment: Record<string, number>;
  }>;

  // Community operations
  createPost(post: InsertPost & { authorId: string }): Promise<Post>;
  getPosts(filters?: {
    postType?: string;
    isOfficial?: boolean;
    authorId?: string;
    limit?: number;
    offset?: number;
  }): Promise<PostWithDetails[]>;
  getPost(id: string): Promise<PostWithDetails | undefined>;

  // Comment operations
  createComment(comment: InsertComment & { authorId: string }): Promise<Comment>;
  getComments(filters: {
    postId?: string;
    issueId?: string;
    limit?: number;
    offset?: number;
  }): Promise<(Comment & { author: User })[]>;

  // Engagement operations
  toggleLike(userId: string, postId?: string, issueId?: string): Promise<void>;
  getUserEngagement(userId: string, postId?: string, issueId?: string): Promise<boolean>;

  // Analytics operations
  getDashboardStats(userId?: string, role?: string): Promise<{
    totalReports: number;
    inProgress: number;
    resolved: number;
    avgResponseTime: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Issue operations
  async createIssue(issueData: InsertIssue & { reporterId: string }): Promise<Issue> {
    const [issue] = await db
      .insert(issues)
      .values(issueData)
      .returning();
    return issue;
  }

  async getIssue(id: string): Promise<IssueWithDetails | undefined> {
    const [issue] = await db
      .select()
      .from(issues)
      .leftJoin(users, eq(issues.reporterId, users.id))
      .where(eq(issues.id, id));

    if (!issue) return undefined;

    // Get assigned user
    let assignedTo = undefined;
    if (issue.issues.assignedToId) {
      const [assigned] = await db
        .select()
        .from(users)
        .where(eq(users.id, issue.issues.assignedToId));
      assignedTo = assigned;
    }

    // Get updates
    const updates = await db
      .select()
      .from(issueUpdates)
      .leftJoin(users, eq(issueUpdates.updatedById, users.id))
      .where(eq(issueUpdates.issueId, id))
      .orderBy(desc(issueUpdates.createdAt));

    // Get comments
    const commentsData = await db
      .select()
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.issueId, id))
      .orderBy(desc(comments.createdAt));

    return {
      ...issue.issues,
      reporter: issue.users || undefined,
      assignedTo,
      updates: updates.map(u => ({
        ...u.issue_updates,
        updatedBy: u.users!,
      })),
      comments: commentsData.map(c => ({
        ...c.comments,
        author: c.users!,
      })),
    };
  }

  async getAllIssues(): Promise<IssueWithDetails[]> {
    const issuesData = await db
      .select()
      .from(issues)
      .leftJoin(users, eq(issues.reporterId, users.id))
      .orderBy(desc(issues.createdAt));

    return issuesData.map(issue => ({
      ...issue.issues,
      reporter: issue.users || undefined,
      assignedTo: undefined,
      updates: [],
      comments: [],
    }));
  }

  async getRecentIssues(limit: number = 5): Promise<IssueWithDetails[]> {
    const issuesData = await db
      .select()
      .from(issues)
      .leftJoin(users, eq(issues.reporterId, users.id))
      .orderBy(desc(issues.createdAt))
      .limit(limit);

    return issuesData.map(issue => ({
      ...issue.issues,
      reporter: issue.users || undefined,
      assignedTo: undefined,
      updates: [],
      comments: [],
    }));
  }

  async getIssues(filters?: {
    status?: string;
    issueType?: string;
    department?: string;
    reporterId?: string;
    assignedToId?: string;
    limit?: number;
    offset?: number;
  }): Promise<IssueWithDetails[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(issues.status, filters.status as any));
    if (filters?.issueType) conditions.push(eq(issues.issueType, filters.issueType as any));
    if (filters?.department) conditions.push(eq(issues.department, filters.department));
    if (filters?.reporterId) conditions.push(eq(issues.reporterId, filters.reporterId));
    if (filters?.assignedToId) conditions.push(eq(issues.assignedToId, filters.assignedToId));

    const baseQuery = db
      .select()
      .from(issues)
      .leftJoin(users, eq(issues.reporterId, users.id))
      .orderBy(desc(issues.createdAt));

    let query = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    if (filters?.limit && filters?.offset) {
      query = query.limit(filters.limit).offset(filters.offset);
    } else if (filters?.limit) {
      query = query.limit(filters.limit);
    } else if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query;

    return results.map(result => ({
      ...result.issues,
      reporter: result.users || undefined,
    }));
  }

  async updateIssueStatus(
    issueId: string,
    update: UpdateIssueStatus & { updatedById: string }
  ): Promise<Issue> {
    // Get current issue
    const [currentIssue] = await db
      .select()
      .from(issues)
      .where(eq(issues.id, issueId));

    if (!currentIssue) {
      throw new Error("Issue not found");
    }

    // Update issue
    const updateData: any = {
      status: update.status,
      updatedAt: new Date(),
    };

    if (update.assignedToId) {
      updateData.assignedToId = update.assignedToId;
    }

    if (update.status === "resolved") {
      updateData.resolvedAt = new Date();
    }

    const [updatedIssue] = await db
      .update(issues)
      .set(updateData)
      .where(eq(issues.id, issueId))
      .returning();

    // Create audit log entry
    await db.insert(issueUpdates).values({
      issueId,
      updatedById: update.updatedById,
      oldStatus: currentIssue.status,
      newStatus: update.status,
      oldAssignedTo: currentIssue.assignedToId,
      newAssignedTo: update.assignedToId,
      updateType: "status_change",
      comment: update.comment,
      internalNotes: update.internalNotes,
    });

    return updatedIssue;
  }

  async getIssuesByLocation(lat: number, lng: number, radiusKm: number = 5): Promise<Issue[]> {
    // Using Haversine formula for distance calculation
    const results = await db
      .select()
      .from(issues)
      .where(
        sql`(
          6371 * acos(
            cos(radians(${lat})) * 
            cos(radians(${issues.latitude})) * 
            cos(radians(${issues.longitude}) - radians(${lng})) + 
            sin(radians(${lat})) * 
            sin(radians(${issues.latitude}))
          )
        ) <= ${radiusKm}`
      );

    return results;
  }

  async getIssueStats(filters?: {
    department?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    byType: Record<string, number>;
    byDepartment: Record<string, number>;
  }> {
    let conditions = [];
    
    if (filters?.department) {
      conditions.push(eq(issues.department, filters.department));
    }
    
    if (filters?.dateFrom) {
      conditions.push(sql`${issues.createdAt} >= ${filters.dateFrom}`);
    }
    
    if (filters?.dateTo) {
      conditions.push(sql`${issues.createdAt} <= ${filters.dateTo}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get basic counts
    const [totalResult] = await db
      .select({ count: count() })
      .from(issues)
      .where(whereClause);

    const [pendingResult] = await db
      .select({ count: count() })
      .from(issues)
      .where(whereClause ? and(whereClause, eq(issues.status, "pending")) : eq(issues.status, "pending"));

    const [inProgressResult] = await db
      .select({ count: count() })
      .from(issues)
      .where(whereClause ? and(whereClause, eq(issues.status, "in_progress")) : eq(issues.status, "in_progress"));

    const [resolvedResult] = await db
      .select({ count: count() })
      .from(issues)
      .where(whereClause ? and(whereClause, eq(issues.status, "resolved")) : eq(issues.status, "resolved"));

    // Get counts by type
    const typeResults = await db
      .select({
        type: issues.issueType,
        count: count(),
      })
      .from(issues)
      .where(whereClause)
      .groupBy(issues.issueType);

    // Get counts by department
    const deptResults = await db
      .select({
        department: issues.department,
        count: count(),
      })
      .from(issues)
      .where(whereClause)
      .groupBy(issues.department);

    return {
      total: totalResult.count,
      pending: pendingResult.count,
      inProgress: inProgressResult.count,
      resolved: resolvedResult.count,
      byType: typeResults.reduce((acc, curr) => {
        acc[curr.type] = curr.count;
        return acc;
      }, {} as Record<string, number>),
      byDepartment: deptResults.reduce((acc, curr) => {
        if (curr.department) {
          acc[curr.department] = curr.count;
        }
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // Community operations
  async createPost(postData: InsertPost & { authorId: string }): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(postData)
      .returning();
    return post;
  }

  async getPosts(filters?: {
    postType?: string;
    isOfficial?: boolean;
    authorId?: string;
    limit?: number;
    offset?: number;
  }): Promise<PostWithDetails[]> {
    const conditions = [];
    if (filters?.postType) conditions.push(eq(posts.postType, filters.postType));
    if (filters?.isOfficial !== undefined) conditions.push(eq(posts.isOfficial, filters.isOfficial));
    if (filters?.authorId) conditions.push(eq(posts.authorId, filters.authorId));

    const baseQuery = db
      .select()
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.isPinned), desc(posts.createdAt));

    let query = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    if (filters?.limit && filters?.offset) {
      query = query.limit(filters.limit).offset(filters.offset);
    } else if (filters?.limit) {
      query = query.limit(filters.limit);
    } else if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query;

    return results.map(result => ({
      ...result.posts,
      author: result.users!,
    }));
  }

  async getPost(id: string): Promise<PostWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, id));

    if (!result) return undefined;

    return {
      ...result.posts,
      author: result.users!,
    };
  }

  // Comment operations
  async createComment(commentData: InsertComment & { authorId: string }): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(commentData)
      .returning();

    // Update comment count on parent post/issue
    if (commentData.postId) {
      await db
        .update(posts)
        .set({ commentsCount: sql`${posts.commentsCount} + 1` })
        .where(eq(posts.id, commentData.postId));
    }

    return comment;
  }

  async getComments(filters: {
    postId?: string;
    issueId?: string;
    limit?: number;
    offset?: number;
  }): Promise<(Comment & { author: User })[]> {
    const conditions = [];
    if (filters.postId) conditions.push(eq(comments.postId, filters.postId));
    if (filters.issueId) conditions.push(eq(comments.issueId, filters.issueId));

    const baseQuery = db
      .select()
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .orderBy(desc(comments.createdAt));

    let query = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    if (filters.limit && filters.offset) {
      query = query.limit(filters.limit).offset(filters.offset);
    } else if (filters.limit) {
      query = query.limit(filters.limit);
    } else if (filters.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query;

    return results.map(result => ({
      ...result.comments,
      author: result.users!,
    }));
  }

  // Engagement operations
  async toggleLike(userId: string, postId?: string, issueId?: string): Promise<void> {
    const conditions = [eq(userEngagement.userId, userId)];
    if (postId) conditions.push(eq(userEngagement.postId, postId));
    if (issueId) conditions.push(eq(userEngagement.issueId, issueId));

    const [existing] = await db
      .select()
      .from(userEngagement)
      .where(and(...conditions, eq(userEngagement.engagementType, "like")));

    if (existing) {
      // Remove like
      await db
        .delete(userEngagement)
        .where(eq(userEngagement.id, existing.id));

      // Update count
      if (postId) {
        await db
          .update(posts)
          .set({ likesCount: sql`${posts.likesCount} - 1` })
          .where(eq(posts.id, postId));
      }
    } else {
      // Add like
      await db.insert(userEngagement).values({
        userId,
        postId,
        issueId,
        engagementType: "like",
      });

      // Update count
      if (postId) {
        await db
          .update(posts)
          .set({ likesCount: sql`${posts.likesCount} + 1` })
          .where(eq(posts.id, postId));
      }
    }
  }

  async getUserEngagement(userId: string, postId?: string, issueId?: string): Promise<boolean> {
    const conditions = [eq(userEngagement.userId, userId)];
    if (postId) conditions.push(eq(userEngagement.postId, postId));
    if (issueId) conditions.push(eq(userEngagement.issueId, issueId));

    const [engagement] = await db
      .select()
      .from(userEngagement)
      .where(and(...conditions, eq(userEngagement.engagementType, "like")));

    return !!engagement;
  }

  // Analytics operations
  async getDashboardStats(userId?: string, role?: string): Promise<{
    totalReports: number;
    inProgress: number;
    resolved: number;
    avgResponseTime: number;
  }> {
    let conditions = [];
    
    if (role === "citizen" && userId) {
      conditions.push(eq(issues.reporterId, userId));
    } else if (role === "official" && userId) {
      conditions.push(eq(issues.assignedToId, userId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ count: count() })
      .from(issues)
      .where(whereClause);

    const [inProgressResult] = await db
      .select({ count: count() })
      .from(issues)
      .where(whereClause ? and(whereClause, eq(issues.status, "in_progress")) : eq(issues.status, "in_progress"));

    const [resolvedResult] = await db
      .select({ count: count() })
      .from(issues)
      .where(whereClause ? and(whereClause, eq(issues.status, "resolved")) : eq(issues.status, "resolved"));

    // Calculate average response time for resolved issues
    const resolvedIssues = await db
      .select({
        createdAt: issues.createdAt,
        resolvedAt: issues.resolvedAt,
      })
      .from(issues)
      .where(whereClause ? and(whereClause, eq(issues.status, "resolved")) : eq(issues.status, "resolved"));

    let avgResponseTime = 0;
    if (resolvedIssues.length > 0) {
      const totalDays = resolvedIssues.reduce((sum, issue) => {
        if (issue.resolvedAt && issue.createdAt) {
          const days = (issue.resolvedAt.getTime() - issue.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }
        return sum;
      }, 0);
      avgResponseTime = totalDays / resolvedIssues.length;
    }

    return {
      totalReports: totalResult.count,
      inProgress: inProgressResult.count,
      resolved: resolvedResult.count,
      avgResponseTime: Math.round(avgResponseTime * 10) / 10, // Round to 1 decimal place
    };
  }
}

export const storage = new DatabaseStorage();
