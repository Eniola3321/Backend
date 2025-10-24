/*
  Warnings:

  - A unique constraint covering the columns `[userId,provider]` on the table `OAuthToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OAuthToken_userId_provider_key" ON "OAuthToken"("userId", "provider");
