import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("citizen"), // citizen, official, admin
  department: varchar("department"), // for officials: public_works, sanitation, transportation, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Issue categories
export const issueTypeEnum = pgEnum("issue_type", [
  "pothole",
  "graffiti", 
  "streetlight",
  "trash_overflow",
  "sidewalk_damage",
  "traffic_sign",
  "water_leak",
  "other"
]);

export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "urgent"]);
export const statusEnum = pgEnum("status", ["pending", "assigned", "in_progress", "resolved", "closed"]);

// Civic issues/reports
export const issues = pgTable("issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  issueType: issueTypeEnum("issue_type").notNull(),
  priority: priorityEnum("priority").notNull().default("medium"),
  status: statusEnum("status").notNull().default("pending"),
  
  // Location data
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  
  // Media and AI analysis
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  aiConfidence: decimal("ai_confidence", { precision: 5, scale: 2 }), // 0-100
  aiAnalysis: jsonb("ai_analysis"), // Raw AI response data
  
  // Assignment and tracking
  reporterId: varchar("reporter_id").references(() => users.id),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  department: varchar("department"),
  
  // Metadata
  isAnonymous: boolean("is_anonymous").default(false),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  estimatedDuration: integer("estimated_duration_days"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Issue status updates and audit trail
export const issueUpdates = pgTable("issue_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  updatedById: varchar("updated_by_id").notNull().references(() => users.id),
  
  oldStatus: statusEnum("old_status"),
  newStatus: statusEnum("new_status"),
  oldAssignedTo: varchar("old_assigned_to"),
  newAssignedTo: varchar("new_assigned_to"),
  
  updateType: varchar("update_type").notNull(), // status_change, assignment, comment, resolution
  comment: text("comment"),
  internalNotes: text("internal_notes"), // Only visible to officials
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Community posts and announcements
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  postType: varchar("post_type").notNull().default("discussion"), // announcement, discussion
  
  authorId: varchar("author_id").notNull().references(() => users.id),
  isOfficial: boolean("is_official").default(false), // Official government posts
  isPinned: boolean("is_pinned").default(false),
  
  // Related issue (optional)
  relatedIssueId: varchar("related_issue_id").references(() => issues.id),
  
  // Engagement
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments on posts and issues
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  
  authorId: varchar("author_id").notNull().references(() => users.id),
  
  // Can comment on either posts or issues
  postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }),
  issueId: varchar("issue_id").references(() => issues.id, { onDelete: "cascade" }),
  
  // Reply threading
  parentCommentId: varchar("parent_comment_id"),
  
  // Moderation
  isModerated: boolean("is_moderated").default(false),
  moderatedById: varchar("moderated_by_id").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User engagement tracking
export const userEngagement = pgTable("user_engagement", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // What they engaged with
  postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }),
  issueId: varchar("issue_id").references(() => issues.id, { onDelete: "cascade" }),
  commentId: varchar("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  
  engagementType: varchar("engagement_type").notNull(), // like, upvote, follow, report
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  reportedIssues: many(issues, { relationName: "reporter" }),
  assignedIssues: many(issues, { relationName: "assignee" }),
  posts: many(posts),
  comments: many(comments),
  issueUpdates: many(issueUpdates),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  reporter: one(users, {
    fields: [issues.reporterId],
    references: [users.id],
    relationName: "reporter",
  }),
  assignedTo: one(users, {
    fields: [issues.assignedToId],
    references: [users.id],
    relationName: "assignee",
  }),
  updates: many(issueUpdates),
  comments: many(comments),
  relatedPosts: many(posts),
}));

export const issueUpdatesRelations = relations(issueUpdates, ({ one }) => ({
  issue: one(issues, {
    fields: [issueUpdates.issueId],
    references: [issues.id],
  }),
  updatedBy: one(users, {
    fields: [issueUpdates.updatedById],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  relatedIssue: one(issues, {
    fields: [posts.relatedIssueId],
    references: [issues.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  issue: one(issues, {
    fields: [comments.issueId],
    references: [issues.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  department: true,
});

export const insertIssueSchema = createInsertSchema(issues).pick({
  title: true,
  description: true,
  issueType: true,
  priority: true,
  address: true,
  latitude: true,
  longitude: true,
  imageUrl: true,
  videoUrl: true,
  isAnonymous: true,
  department: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  title: true,
  content: true,
  postType: true,
  isOfficial: true,
  relatedIssueId: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  postId: true,
  issueId: true,
  parentCommentId: true,
});

export const updateIssueStatusSchema = z.object({
  status: z.enum(["pending", "assigned", "in_progress", "resolved", "closed"]),
  assignedToId: z.string().optional(),
  comment: z.string().optional(),
  internalNotes: z.string().optional(),
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type IssueUpdate = typeof issueUpdates.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type UpdateIssueStatus = z.infer<typeof updateIssueStatusSchema>;

// Extended types with relations
export type IssueWithDetails = Issue & {
  reporter?: User;
  assignedTo?: User;
  updates?: (IssueUpdate & { updatedBy: User })[];
  comments?: (Comment & { author: User })[];
};

export type PostWithDetails = Post & {
  author: User;
  relatedIssue?: Issue;
  comments?: (Comment & { author: User })[];
};
