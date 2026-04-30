import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import {
  teams,
  teamMembers,
  projectComments,
  collaborationSessions,
} from "../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";

const generateToken = () => crypto.randomBytes(16).toString("hex");

export const collaborationAdvancedRouter = router({
  // Create team
  createTeam: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        description: z.string().optional(),
        slug: z.string().min(1).max(128),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(teams).values({
        ownerId: ctx.user?.id || 0,
        name: input.name,
        description: input.description,
        slug: input.slug,
        isPublic: false,
      });

      // Get the created team
      const [newTeam] = await db
        .select()
        .from(teams)
        .where(eq(teams.slug, input.slug))
        .limit(1);

      // Add owner as admin member
      await db.insert(teamMembers).values({
        teamId: newTeam.id,
        userId: ctx.user?.id || 0,
        role: "owner",
      });

      return { success: true, teamId: newTeam.id };
    }),

  // Get user teams
  getUserTeams: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userTeams = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, ctx.user?.id || 0));

    const teamIds = userTeams.map((t) => t.teamId);
    if (teamIds.length === 0) return [];

    // Fetch teams one by one (Drizzle limitation)
    const teamData = [];
    for (const teamId of teamIds) {
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);
      if (team) teamData.push(team);
    }

    return teamData;
  }),

  // Add team member
  addTeamMember: protectedProcedure
    .input(
      z.object({
        teamId: z.number(),
        userId: z.number(),
        role: z.enum(["admin", "editor", "viewer"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(teamMembers).values({
        teamId: input.teamId,
        userId: input.userId,
        role: input.role,
      });

      return { success: true };
    }),

  // Add project comment
  addProjectComment: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        content: z.string().min(1).max(5000),
        parentCommentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(projectComments).values({
        projectId: input.projectId,
        userId: ctx.user?.id || 0,
        content: input.content,
        parentCommentId: input.parentCommentId,
      });

      return { success: true };
    }),

  // Get project comments
  getProjectComments: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const comments = await db
        .select()
        .from(projectComments)
        .where(eq(projectComments.projectId, input.projectId));

      return comments;
    }),

  // Like comment
  likeComment: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [comment] = await db
        .select()
        .from(projectComments)
        .where(eq(projectComments.id, input.commentId))
        .limit(1);

      if (comment) {
        await db
          .update(projectComments)
          .set({ likes: (comment.likes || 0) + 1 })
          .where(eq(projectComments.id, input.commentId));
      }

      return { success: true };
    }),

  // Create collaboration session
  createCollaborationSession: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.insert(collaborationSessions).values({
        projectId: input.projectId,
        sessionToken,
        activeUsers: 1,
        expiresAt,
      });

      return { success: true, sessionToken };
    }),

  // Get active collaborators
  getActiveCollaborators: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sessions = await db
        .select()
        .from(collaborationSessions)
        .where(eq(collaborationSessions.projectId, input.projectId));

      // Filter by expiration on client side
      const now = Date.now();
      const activeSessions = sessions.filter(
        (s) => s.expiresAt && s.expiresAt.getTime() > now
      );

      return activeSessions;
    }),
});
