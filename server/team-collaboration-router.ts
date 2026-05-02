/**
 * Team Collaboration Router
 * Manage team members, roles, permissions, and deployment approvals
 */

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

type UserRole = "owner" | "admin" | "maintainer" | "developer" | "viewer";

interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  joinedAt: string;
  lastActive: string;
}

interface DeploymentApproval {
  id: string;
  deploymentId: string;
  requiredApprovals: number;
  currentApprovals: number;
  approvers: Array<{
    userId: string;
    name: string;
    approvedAt: string;
  }>;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

interface RolePermissions {
  role: UserRole;
  permissions: string[];
}

// In-memory storage (in production, use database)
const teamMembers = new Map<string, TeamMember[]>();
const deploymentApprovals = new Map<string, DeploymentApproval[]>();

const rolePermissions: Record<UserRole, string[]> = {
  owner: [
    "manage_team",
    "manage_deployments",
    "manage_settings",
    "view_analytics",
    "approve_deployments",
    "manage_integrations",
    "manage_billing",
  ],
  admin: [
    "manage_team",
    "manage_deployments",
    "view_analytics",
    "approve_deployments",
    "manage_integrations",
  ],
  maintainer: [
    "manage_deployments",
    "view_analytics",
    "approve_deployments",
  ],
  developer: [
    "manage_deployments",
    "view_analytics",
  ],
  viewer: [
    "view_analytics",
  ],
};

export const teamCollaborationRouter = router({
  /**
   * Get team members
   */
  getTeamMembers: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const members = teamMembers.get(input.projectId) || [];

        return {
          members: members.map((m) => ({
            id: m.id,
            email: m.email,
            name: m.name,
            role: m.role,
            joinedAt: m.joinedAt,
            lastActive: m.lastActive,
          })),
          total: members.length,
        };
      } catch (error) {
        throw new Error(
          `Failed to get team members: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Add team member
   */
  addTeamMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        email: z.string().email(),
        name: z.string(),
        role: z.enum(["admin", "maintainer", "developer", "viewer"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        let members = teamMembers.get(input.projectId) || [];

        // Check if member already exists
        if (members.some((m) => m.email === input.email)) {
          throw new Error("Team member already exists");
        }

        const member: TeamMember = {
          id: `member_${Date.now()}`,
          userId: `user_${Date.now()}`,
          email: input.email,
          name: input.name,
          role: input.role,
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
        };

        members.push(member);
        teamMembers.set(input.projectId, members);

        return {
          success: true,
          member: {
            id: member.id,
            email: member.email,
            name: member.name,
            role: member.role,
          },
        };
      } catch (error) {
        throw new Error(
          `Failed to add team member: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Update team member role
   */
  updateTeamMemberRole: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        memberId: z.string(),
        role: z.enum(["admin", "maintainer", "developer", "viewer"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const members = teamMembers.get(input.projectId) || [];
        const member = members.find((m) => m.id === input.memberId);

        if (!member) {
          throw new Error("Team member not found");
        }

        member.role = input.role;

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to update team member role: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Remove team member
   */
  removeTeamMember: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        memberId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        let members = teamMembers.get(input.projectId) || [];
        const index = members.findIndex((m) => m.id === input.memberId);

        if (index < 0) {
          throw new Error("Team member not found");
        }

        members.splice(index, 1);
        teamMembers.set(input.projectId, members);

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to remove team member: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get user permissions
   */
  getUserPermissions: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        userId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const members = teamMembers.get(input.projectId) || [];
        const member = members.find((m) => m.userId === input.userId);

        if (!member) {
          return {
            permissions: [],
            role: "viewer",
          };
        }

        return {
          permissions: rolePermissions[member.role],
          role: member.role,
        };
      } catch (error) {
        throw new Error(
          `Failed to get user permissions: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Create deployment approval request
   */
  createDeploymentApproval: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        deploymentId: z.string(),
        requiredApprovals: z.number().min(1).max(10),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const approval: DeploymentApproval = {
          id: `approval_${Date.now()}`,
          deploymentId: input.deploymentId,
          requiredApprovals: input.requiredApprovals,
          currentApprovals: 0,
          approvers: [],
          status: "pending",
        };

        let approvals = deploymentApprovals.get(input.projectId) || [];
        approvals.push(approval);
        deploymentApprovals.set(input.projectId, approvals);

        return {
          success: true,
          approvalId: approval.id,
        };
      } catch (error) {
        throw new Error(
          `Failed to create deployment approval: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Approve deployment
   */
  approveDeployment: protectedProcedure
    .input(
      z.object({
        approvalId: z.string(),
        projectId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const approvals = deploymentApprovals.get(input.projectId) || [];
        const approval = approvals.find((a) => a.id === input.approvalId);

        if (!approval) {
          throw new Error("Approval not found");
        }

        if (approval.status !== "pending") {
          throw new Error("Approval is not pending");
        }

        // Check if user already approved
        if (approval.approvers.some((a) => a.userId === String(ctx.user?.id))) {
          throw new Error("User has already approved this deployment");
        }

        approval.approvers.push({
          userId: String(ctx.user?.id || "system"),
          name: String(ctx.user?.name || "Unknown"),
          approvedAt: new Date().toISOString(),
        });

        approval.currentApprovals = approval.approvers.length;

        if (approval.currentApprovals >= approval.requiredApprovals) {
          approval.status = "approved";
        }

        return {
          success: true,
          status: approval.status,
          currentApprovals: approval.currentApprovals,
          requiredApprovals: approval.requiredApprovals,
        };
      } catch (error) {
        throw new Error(
          `Failed to approve deployment: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Reject deployment
   */
  rejectDeployment: protectedProcedure
    .input(
      z.object({
        approvalId: z.string(),
        projectId: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const approvals = deploymentApprovals.get(input.projectId) || [];
        const approval = approvals.find((a) => a.id === input.approvalId);

        if (!approval) {
          throw new Error("Approval not found");
        }

        if (approval.status !== "pending") {
          throw new Error("Approval is not pending");
        }

        approval.status = "rejected";
        approval.rejectionReason = input.reason;

        return {
          success: true,
        };
      } catch (error) {
        throw new Error(
          `Failed to reject deployment: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get deployment approval status
   */
  getDeploymentApprovalStatus: protectedProcedure
    .input(
      z.object({
        approvalId: z.string(),
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const approvals = deploymentApprovals.get(input.projectId) || [];
        const approval = approvals.find((a) => a.id === input.approvalId);

        if (!approval) {
          throw new Error("Approval not found");
        }

        return approval;
      } catch (error) {
        throw new Error(
          `Failed to get approval status: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get role permissions
   */
  getRolePermissions: protectedProcedure
    .input(
      z.object({
        role: z.enum(["owner", "admin", "maintainer", "developer", "viewer"]),
      })
    )
    .query(async ({ input }) => {
      try {
        return {
          role: input.role,
          permissions: rolePermissions[input.role],
        };
      } catch (error) {
        throw new Error(
          `Failed to get role permissions: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get all role permissions
   */
  getAllRolePermissions: protectedProcedure.query(async () => {
    try {
      return Object.entries(rolePermissions).map(([role, permissions]) => ({
        role,
        permissions,
      }));
    } catch (error) {
      throw new Error(
        `Failed to get role permissions: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),
});
