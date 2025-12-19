/*
  Warnings:

  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_chatId_fkey`;

-- AlterTable
ALTER TABLE `Chat` ADD COLUMN `messages` JSON NOT NULL;

-- DropTable
DROP TABLE `Message`;
