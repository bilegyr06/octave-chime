-- CreateEnum
CREATE TYPE "BankStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('platform_admin', 'bank_admin');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('pending', 'granted', 'revoked');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('not_started', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('pending_link', 'active', 'paused', 'opted_out', 'link_expired');

-- CreateEnum
CREATE TYPE "LinkProvider" AS ENUM ('mono_simulated', 'mono_live', 'direct_bank_api');

-- CreateEnum
CREATE TYPE "LinkedAccountStatus" AS ENUM ('active', 'disconnected');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('debit', 'credit');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('simulated', 'mono', 'direct_bank');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('transaction_alert', 'daily_summary');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('whatsapp', 'email', 'sms');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('queued', 'sent', 'failed', 'skipped');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('platform_admin', 'bank_admin', 'system', 'customer');

-- CreateTable
CREATE TABLE "Bank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "supportEmail" TEXT,
    "status" "BankStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAdmin" (
    "id" TEXT NOT NULL,
    "bankId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'bank_admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "whatsappPhone" TEXT,
    "consentStatus" "ConsentStatus" NOT NULL DEFAULT 'pending',
    "enrollmentStatus" "EnrollmentStatus" NOT NULL DEFAULT 'not_started',
    "serviceStatus" "ServiceStatus" NOT NULL DEFAULT 'pending_link',
    "whatsappAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dailySummaryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "preferredSummaryTime" TEXT NOT NULL DEFAULT '21:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedAccount" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "provider" "LinkProvider" NOT NULL DEFAULT 'mono_simulated',
    "providerAccountId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumberMasked" TEXT NOT NULL,
    "accountType" TEXT NOT NULL DEFAULT 'savings',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "currentBalance" DECIMAL(18,2) NOT NULL,
    "openingBalanceToday" DECIMAL(18,2) NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "LinkedAccountStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "LinkedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "linkedAccountId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "balanceAfter" DECIMAL(18,2) NOT NULL,
    "narration" TEXT,
    "reference" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "source" "TransactionSource" NOT NULL DEFAULT 'simulated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "transactionId" TEXT,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'whatsapp',
    "status" "NotificationStatus" NOT NULL DEFAULT 'queued',
    "recipient" TEXT NOT NULL,
    "messageBody" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySummary" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "linkedAccountId" TEXT NOT NULL,
    "summaryDate" DATE NOT NULL,
    "openingBalance" DECIMAL(18,2) NOT NULL,
    "totalCredits" DECIMAL(18,2) NOT NULL,
    "totalDebits" DECIMAL(18,2) NOT NULL,
    "closingBalance" DECIMAL(18,2) NOT NULL,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "notificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "bankId" TEXT,
    "actorType" "AuditActorType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bank_slug_key" ON "Bank"("slug");

-- CreateIndex
CREATE INDEX "Bank_status_idx" ON "Bank"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BankAdmin_email_key" ON "BankAdmin"("email");

-- CreateIndex
CREATE INDEX "BankAdmin_bankId_idx" ON "BankAdmin"("bankId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_whatsappPhone_key" ON "Customer"("whatsappPhone");

-- CreateIndex
CREATE INDEX "Customer_bankId_idx" ON "Customer"("bankId");

-- CreateIndex
CREATE INDEX "Customer_serviceStatus_idx" ON "Customer"("serviceStatus");

-- CreateIndex
CREATE INDEX "LinkedAccount_customerId_idx" ON "LinkedAccount"("customerId");

-- CreateIndex
CREATE INDEX "LinkedAccount_bankId_idx" ON "LinkedAccount"("bankId");

-- CreateIndex
CREATE INDEX "Transaction_customerId_transactionDate_idx" ON "Transaction"("customerId", "transactionDate");

-- CreateIndex
CREATE INDEX "Transaction_bankId_createdAt_idx" ON "Transaction"("bankId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_linkedAccountId_transactionDate_idx" ON "Transaction"("linkedAccountId", "transactionDate");

-- CreateIndex
CREATE INDEX "Notification_bankId_createdAt_idx" ON "Notification"("bankId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_customerId_createdAt_idx" ON "Notification"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_notificationId_key" ON "DailySummary"("notificationId");

-- CreateIndex
CREATE INDEX "DailySummary_bankId_summaryDate_idx" ON "DailySummary"("bankId", "summaryDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailySummary_customerId_summaryDate_key" ON "DailySummary"("customerId", "summaryDate");

-- CreateIndex
CREATE INDEX "AuditLog_bankId_createdAt_idx" ON "AuditLog"("bankId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorType_actorId_idx" ON "AuditLog"("actorType", "actorId");

-- AddForeignKey
ALTER TABLE "BankAdmin" ADD CONSTRAINT "BankAdmin_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedAccount" ADD CONSTRAINT "LinkedAccount_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedAccount" ADD CONSTRAINT "LinkedAccount_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_linkedAccountId_fkey" FOREIGN KEY ("linkedAccountId") REFERENCES "LinkedAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySummary" ADD CONSTRAINT "DailySummary_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySummary" ADD CONSTRAINT "DailySummary_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySummary" ADD CONSTRAINT "DailySummary_linkedAccountId_fkey" FOREIGN KEY ("linkedAccountId") REFERENCES "LinkedAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySummary" ADD CONSTRAINT "DailySummary_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
