-- CreateEnum
CREATE TYPE "LinkTokenMode" AS ENUM ('enroll', 'reconsent', 'relink');

-- CreateEnum
CREATE TYPE "BotDirection" AS ENUM ('inbound', 'outbound');

-- CreateTable
CREATE TABLE "LinkToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "mode" "LinkTokenMode" NOT NULL,
    "customerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotMessage" (
    "id" TEXT NOT NULL,
    "direction" "BotDirection" NOT NULL,
    "messageId" TEXT,
    "sender" TEXT NOT NULL,
    "recipient" TEXT,
    "text" TEXT NOT NULL,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkToken_token_key" ON "LinkToken"("token");

-- CreateIndex
CREATE INDEX "LinkToken_customerId_idx" ON "LinkToken"("customerId");

-- CreateIndex
CREATE INDEX "LinkToken_expiresAt_idx" ON "LinkToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "BotMessage_messageId_key" ON "BotMessage"("messageId");

-- CreateIndex
CREATE INDEX "BotMessage_customerId_createdAt_idx" ON "BotMessage"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "BotMessage_sender_createdAt_idx" ON "BotMessage"("sender", "createdAt");

-- AddForeignKey
ALTER TABLE "LinkToken" ADD CONSTRAINT "LinkToken_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotMessage" ADD CONSTRAINT "BotMessage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
