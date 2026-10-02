CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`page_id` text NOT NULL,
	`product` text NOT NULL,
	`customer` text NOT NULL,
	`phone` text NOT NULL,
	`city` text NOT NULL,
	`address` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` real NOT NULL,
	`shipping` real NOT NULL,
	`total` real NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`notes` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_orders_date` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_orders_page` ON `orders` (`page_id`);--> statement-breakpoint
CREATE TABLE `pages` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`status` text NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_slug_unique` ON `pages` (`slug`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_id` text NOT NULL,
	`token` text NOT NULL,
	`day` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_visits_page_token_day` ON `visits` (`page_id`,`token`,`day`);