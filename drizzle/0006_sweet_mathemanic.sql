CREATE TABLE `accessibility_audits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`score` int,
	`issues` int NOT NULL DEFAULT 0,
	`wcagLevel` varchar(8),
	`report` text,
	`auditedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accessibility_audits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `api_quotas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`apiKey` varchar(256) NOT NULL,
	`requestsPerMinute` int NOT NULL DEFAULT 60,
	`requestsPerDay` int NOT NULL DEFAULT 10000,
	`currentMinuteRequests` int NOT NULL DEFAULT 0,
	`currentDayRequests` int NOT NULL DEFAULT 0,
	`lastResetMinute` timestamp NOT NULL DEFAULT (now()),
	`lastResetDay` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_quotas_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_quotas_apiKey_unique` UNIQUE(`apiKey`)
);
--> statement-breakpoint
CREATE TABLE `batch_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`jobId` varchar(128) NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`totalItems` int NOT NULL,
	`completedItems` int NOT NULL DEFAULT 0,
	`failedItems` int NOT NULL DEFAULT 0,
	`inputFile` varchar(256),
	`outputFile` varchar(256),
	`errorLog` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `batch_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `batch_jobs_jobId_unique` UNIQUE(`jobId`)
);
--> statement-breakpoint
CREATE TABLE `collaboration_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sessionToken` varchar(256) NOT NULL,
	`activeUsers` int NOT NULL DEFAULT 0,
	`lastActivity` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `collaboration_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `collaboration_sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `generation_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`llmProvider` varchar(64) NOT NULL,
	`tokensUsed` int NOT NULL,
	`estimatedCost` decimal(10,4),
	`generationTime` int,
	`success` boolean NOT NULL DEFAULT true,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generation_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `llm_model_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`preferredModel` varchar(64) NOT NULL,
	`costPerMillion` decimal(10,4),
	`speedRating` int,
	`qualityRating` int,
	`lastUsed` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `llm_model_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sellerId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`category` varchar(64) NOT NULL,
	`tags` text,
	`downloads` int NOT NULL DEFAULT 0,
	`rating` decimal(3,2),
	`reviews` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplace_listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`views` int NOT NULL DEFAULT 0,
	`downloads` int NOT NULL DEFAULT 0,
	`forks` int NOT NULL DEFAULT 0,
	`stars` int NOT NULL DEFAULT 0,
	`lastViewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`parentCommentId` int,
	`likes` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredUserId` int,
	`referralCode` varchar(32) NOT NULL,
	`status` enum('pending','activated','rewarded') NOT NULL DEFAULT 'pending',
	`rewardCredits` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`activatedAt` timestamp,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `security_scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`scanType` varchar(64) NOT NULL,
	`vulnerabilities` int NOT NULL DEFAULT 0,
	`warnings` int NOT NULL DEFAULT 0,
	`criticalIssues` int NOT NULL DEFAULT 0,
	`report` text,
	`status` enum('passed','warning','failed') NOT NULL DEFAULT 'passed',
	`scannedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_scans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','editor','viewer') NOT NULL DEFAULT 'viewer',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`slug` varchar(128) NOT NULL,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`),
	CONSTRAINT `teams_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_activity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`projectId` int,
	`metadata` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`url` varchar(512) NOT NULL,
	`events` text NOT NULL,
	`secret` varchar(256) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastTriggered` timestamp,
	`failureCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhooks_id` PRIMARY KEY(`id`)
);
