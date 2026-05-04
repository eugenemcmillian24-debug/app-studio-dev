/**
 * SMS & Push Notifications Router
 * Handle SMS verification, push notifications, and notification preferences
 */

import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

interface PushSubscription {
  userId: string;
  endpoint: string;
  auth: string;
  p256dh: string;
  createdAt: Date;
}

interface NotificationPreference {
  userId: string;
  deploymentStatus: boolean;
  referralEarnings: boolean;
  accountAlerts: boolean;
  weeklyDigest: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

interface SMSVerification {
  phoneNumber: string;
  code: string;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
}

// In-memory storage (in production, use database)
const pushSubscriptions = new Map<string, PushSubscription[]>();
const notificationPreferences = new Map<string, NotificationPreference>();
const smsVerifications = new Map<string, SMSVerification>();

export const notificationsSMSPushRouter = router({
  /**
   * Send SMS verification code
   */
  sendSMSVerification: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const verification: SMSVerification = {
          phoneNumber: input.phoneNumber,
          code,
          verified: false,
          expiresAt,
          createdAt: new Date(),
        };

        smsVerifications.set(input.phoneNumber, verification);

        // In production, send actual SMS via Twilio/AWS SNS
        console.log(`[SMS] Verification code sent to ${input.phoneNumber}: ${code}`);

        return {
          success: true,
          message: "SMS verification code sent",
          code, // For testing only
        };
      } catch (error) {
        throw new Error(
          `Failed to send SMS verification: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Verify SMS code
   */
  verifySMSCode: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        code: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const verification = smsVerifications.get(input.phoneNumber);

        if (!verification) {
          throw new Error("No SMS verification found for this phone number");
        }

        if (new Date() > verification.expiresAt) {
          throw new Error("SMS verification code has expired");
        }

        if (verification.code !== input.code) {
          throw new Error("Invalid SMS verification code");
        }

        verification.verified = true;

        return {
          success: true,
          message: "Phone number verified successfully",
        };
      } catch (error) {
        throw new Error(
          `Failed to verify SMS code: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Subscribe to push notifications
   */
  subscribeToPushNotifications: protectedProcedure
    .input(
      z.object({
        subscription: z.object({
          endpoint: z.string(),
          keys: z.object({
            auth: z.string(),
            p256dh: z.string(),
          }),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id);

        const pushSub: PushSubscription = {
          userId,
          endpoint: input.subscription.endpoint,
          auth: input.subscription.keys.auth,
          p256dh: input.subscription.keys.p256dh,
          createdAt: new Date(),
        };

        const userSubs = pushSubscriptions.get(userId) || [];
        userSubs.push(pushSub);
        pushSubscriptions.set(userId, userSubs);

        return {
          success: true,
          message: "Successfully subscribed to push notifications",
        };
      } catch (error) {
        throw new Error(
          `Failed to subscribe to push notifications: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Unsubscribe from push notifications
   */
  unsubscribeFromPushNotifications: protectedProcedure
    .input(
      z.object({
        endpoint: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id);
        const userSubs = pushSubscriptions.get(userId) || [];

        const filtered = userSubs.filter((sub) => sub.endpoint !== input.endpoint);
        pushSubscriptions.set(userId, filtered);

        return {
          success: true,
          message: "Successfully unsubscribed from push notifications",
        };
      } catch (error) {
        throw new Error(
          `Failed to unsubscribe from push notifications: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get notification preferences
   */
  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = String(ctx.user?.id);
      let prefs = notificationPreferences.get(userId);

      if (!prefs) {
        prefs = {
          userId,
          deploymentStatus: true,
          referralEarnings: true,
          accountAlerts: true,
          weeklyDigest: true,
          smsEnabled: false,
          pushEnabled: true,
          emailEnabled: true,
        };
        notificationPreferences.set(userId, prefs);
      }

      return prefs;
    } catch (error) {
      throw new Error(
        `Failed to get notification preferences: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: protectedProcedure
    .input(
      z.object({
        deploymentStatus: z.boolean().optional(),
        referralEarnings: z.boolean().optional(),
        accountAlerts: z.boolean().optional(),
        weeklyDigest: z.boolean().optional(),
        smsEnabled: z.boolean().optional(),
        pushEnabled: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = String(ctx.user?.id);
        let prefs = notificationPreferences.get(userId);

        if (!prefs) {
          prefs = {
            userId,
            deploymentStatus: true,
            referralEarnings: true,
            accountAlerts: true,
            weeklyDigest: true,
            smsEnabled: false,
            pushEnabled: true,
            emailEnabled: true,
          };
        }

        // Update only provided fields
        if (input.deploymentStatus !== undefined) prefs.deploymentStatus = input.deploymentStatus;
        if (input.referralEarnings !== undefined) prefs.referralEarnings = input.referralEarnings;
        if (input.accountAlerts !== undefined) prefs.accountAlerts = input.accountAlerts;
        if (input.weeklyDigest !== undefined) prefs.weeklyDigest = input.weeklyDigest;
        if (input.smsEnabled !== undefined) prefs.smsEnabled = input.smsEnabled;
        if (input.pushEnabled !== undefined) prefs.pushEnabled = input.pushEnabled;
        if (input.emailEnabled !== undefined) prefs.emailEnabled = input.emailEnabled;

        notificationPreferences.set(userId, prefs);

        return {
          success: true,
          message: "Notification preferences updated",
          preferences: prefs,
        };
      } catch (error) {
        throw new Error(
          `Failed to update notification preferences: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Send test push notification
   */
  sendTestPushNotification: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const userId = String(ctx.user?.id);
      const userSubs = pushSubscriptions.get(userId) || [];

      if (userSubs.length === 0) {
        throw new Error("No push subscriptions found");
      }

      // In production, send actual push notifications
      const notification = {
        title: "AppStudio Test Notification",
        body: "This is a test push notification from AppStudio",
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
        tag: "appstudio-test",
      };

      console.log(`[Push] Test notification sent to ${userSubs.length} subscriptions`);

      return {
        success: true,
        message: `Test notification sent to ${userSubs.length} device(s)`,
      };
    } catch (error) {
      throw new Error(
        `Failed to send test notification: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Get push subscription status
   */
  getPushSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = String(ctx.user?.id);
      const userSubs = pushSubscriptions.get(userId) || [];

      return {
        subscribed: userSubs.length > 0,
        subscriptionCount: userSubs.length,
        lastSubscribed: userSubs.length > 0 ? userSubs[userSubs.length - 1].createdAt : null,
      };
    } catch (error) {
      throw new Error(
        `Failed to get push subscription status: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),
});
