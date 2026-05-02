CREATE TABLE `github_vercel_sync_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`syncType` enum('github_to_local','local_to_github','github_to_vercel','vercel_to_github') NOT NULL,
	`status` enum('pending','in_progress','completed','failed') NOT NULL DEFAULT 'pending',
	`filesChanged` int NOT NULL DEFAULT 0,
	`filesAdded` int NOT NULL DEFAULT 0,
	`filesDeleted` int NOT NULL DEFAULT 0,
	`conflictCount` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`syncDetails` text,
	`triggeredBy` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `github_vercel_sync_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `github_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`githubUserId` int NOT NULL,
	`githubUsername` varchar(128) NOT NULL,
	`githubEmail` varchar(256),
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`scope` varchar(512),
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSyncAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `github_integrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `github_integrations_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `github_integrations_githubUserId_unique` UNIQUE(`githubUserId`)
);
--> statement-breakpoint
CREATE TABLE `github_issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`githubRepoId` int NOT NULL,
	`issueNumber` int NOT NULL,
	`issueTitle` varchar(256) NOT NULL,
	`issueDescription` text,
	`author` varchar(128) NOT NULL,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`labels` text,
	`assignees` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`closedAt` timestamp,
	CONSTRAINT `github_issues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `github_pull_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`githubRepoId` int NOT NULL,
	`prNumber` int NOT NULL,
	`prTitle` varchar(256) NOT NULL,
	`prDescription` text,
	`author` varchar(128) NOT NULL,
	`sourceBranch` varchar(128) NOT NULL,
	`targetBranch` varchar(128) NOT NULL,
	`status` enum('open','closed','merged','draft') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`mergedAt` timestamp,
	`closedAt` timestamp,
	CONSTRAINT `github_pull_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_github_repos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`githubRepoId` int NOT NULL,
	`repoUrl` varchar(256) NOT NULL,
	`repoName` varchar(128) NOT NULL,
	`repoOwner` varchar(128) NOT NULL,
	`defaultBranch` varchar(128) NOT NULL DEFAULT 'main',
	`lastPushedAt` timestamp,
	`lastSyncedAt` timestamp,
	`syncStatus` enum('in_sync','out_of_sync','syncing','error') NOT NULL DEFAULT 'in_sync',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_github_repos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_vercel_deployments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`vercelProjectId` varchar(128) NOT NULL,
	`vercelProjectName` varchar(128) NOT NULL,
	`productionUrl` varchar(256),
	`previewUrl` varchar(256),
	`gitHubRepoId` int,
	`autoDeployEnabled` boolean NOT NULL DEFAULT true,
	`deploymentStatus` enum('idle','building','ready','error','canceled') NOT NULL DEFAULT 'idle',
	`lastDeploymentAt` timestamp,
	`lastDeploymentStatus` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_vercel_deployments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vercel_deployment_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`vercelDeploymentId` varchar(128) NOT NULL,
	`vercelProjectId` varchar(128) NOT NULL,
	`status` enum('building','ready','error','canceled') NOT NULL,
	`environment` enum('production','preview') NOT NULL DEFAULT 'preview',
	`gitCommitSha` varchar(128),
	`gitBranch` varchar(128),
	`gitCommitMessage` text,
	`deploymentUrl` varchar(256),
	`errorMessage` text,
	`buildDurationMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `vercel_deployment_history_id` PRIMARY KEY(`id`),
	CONSTRAINT `vercel_deployment_history_vercelDeploymentId_unique` UNIQUE(`vercelDeploymentId`)
);
--> statement-breakpoint
CREATE TABLE `vercel_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`vercelUserId` varchar(128) NOT NULL,
	`vercelUsername` varchar(128) NOT NULL,
	`accessToken` text NOT NULL,
	`teamId` varchar(128),
	`scope` varchar(512),
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSyncAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vercel_integrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `vercel_integrations_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `vercel_integrations_vercelUserId_unique` UNIQUE(`vercelUserId`)
);
--> statement-breakpoint
CREATE TABLE `webhook_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`webhookSource` enum('github','vercel') NOT NULL,
	`eventType` varchar(128) NOT NULL,
	`deliveryId` varchar(256) NOT NULL,
	`payload` text,
	`statusCode` int,
	`responseBody` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 5,
	`nextRetryAt` timestamp,
	`isSuccessful` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `webhook_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhook_deliveries_deliveryId_unique` UNIQUE(`deliveryId`)
);
