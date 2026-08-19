ALTER TABLE "User"
ADD COLUMN "accessStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "asaasCustomerId" TEXT;

ALTER TABLE "Subscription"
ADD COLUMN "paymentId" TEXT,
ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';

CREATE UNIQUE INDEX "Subscription_paymentId_key" ON "Subscription"("paymentId");
CREATE INDEX "Subscription_providerId_idx" ON "Subscription"("providerId");
