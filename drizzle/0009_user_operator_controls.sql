CREATE TABLE `userOperatorControls` (
	`userId` int NOT NULL,
	`outreachPaused` int DEFAULT 0 NOT NULL,
	`pauseReason` text,
	`retentionDays` int DEFAULT 365 NOT NULL,
	`createdAt` timestamp DEFAULT (now()) NOT NULL,
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `userOperatorControls_userId` PRIMARY KEY(`userId`),
	CONSTRAINT `userOperatorControls_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade
);
