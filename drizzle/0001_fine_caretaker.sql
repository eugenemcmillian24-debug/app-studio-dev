CREATE TABLE `generated_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`prompt` text NOT NULL,
	`appName` varchar(128) NOT NULL,
	`appDescription` text NOT NULL,
	`appCategory` varchar(32) NOT NULL,
	`techStack` text NOT NULL,
	`files` text NOT NULL,
	`sqlSchema` text NOT NULL,
	`envExample` text NOT NULL,
	`readmeContent` text NOT NULL,
	`packageJson` text NOT NULL,
	`aiModel` varchar(64),
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generated_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`prompt` text,
	`success` boolean NOT NULL DEFAULT true,
	`modelUsed` varchar(64),
	`durationMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generation_logs_id` PRIMARY KEY(`id`)
);
