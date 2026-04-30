CREATE TABLE `api_documentation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`openApiSpec` text NOT NULL,
	`swaggerUrl` varchar(256),
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_documentation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collection_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collectionId` int NOT NULL,
	`projectId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_domains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`domain` varchar(256) NOT NULL,
	`verificationToken` varchar(128),
	`isVerified` boolean NOT NULL DEFAULT false,
	`deploymentUrl` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`verifiedAt` timestamp,
	CONSTRAINT `custom_domains_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_domains_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `email_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('quota_warning','generation_complete','payment_receipt','system_alert') NOT NULL,
	`subject` varchar(256) NOT NULL,
	`body` text NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `export_formats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`format` enum('individual','monorepo','turborepo') NOT NULL DEFAULT 'individual',
	`exportedAt` timestamp NOT NULL DEFAULT (now()),
	`downloadUrl` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `export_formats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`prompt` text NOT NULL,
	`llmProvider` varchar(32),
	`tokenCount` int,
	`durationMs` int,
	`success` boolean NOT NULL DEFAULT true,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generation_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `github_repos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int NOT NULL,
	`repoUrl` varchar(256) NOT NULL,
	`repoName` varchar(128) NOT NULL,
	`repoOwner` varchar(128) NOT NULL,
	`lastPushedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `github_repos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`color` varchar(7) DEFAULT '#6366f1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_collections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`ownerId` int NOT NULL,
	`sharedWithEmail` varchar(320) NOT NULL,
	`permission` enum('view','edit','admin') NOT NULL DEFAULT 'view',
	`sharedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(32) NOT NULL,
	`prompt` text NOT NULL,
	`techStack` text NOT NULL,
	`icon` varchar(64),
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schema_edits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`originalSchema` text NOT NULL,
	`modifiedSchema` text NOT NULL,
	`changeDescription` text,
	`appliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schema_edits_id` PRIMARY KEY(`id`)
);
