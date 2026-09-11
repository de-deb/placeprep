-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CodingProblem" ADD COLUMN     "executionSupported" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "expectedSpaceComplexity" TEXT,
ADD COLUMN     "expectedTimeComplexity" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalUrl" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN     "starterCode" JSONB;

-- CreateTable
CREATE TABLE "CodingTestCase" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "input" TEXT NOT NULL DEFAULT '',
    "expectedOutput" TEXT NOT NULL,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CodingTestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "runtimeMs" INTEGER,
    "memoryKb" INTEGER,
    "passedTests" INTEGER NOT NULL DEFAULT 0,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodingSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingLanguage" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pistonRuntime" TEXT NOT NULL,
    "version" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CodingLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CodingTestCase_problemId_idx" ON "CodingTestCase"("problemId");

-- CreateIndex
CREATE INDEX "CodingSubmission_userId_problemId_idx" ON "CodingSubmission"("userId", "problemId");

-- CreateIndex
CREATE INDEX "CodingSubmission_problemId_idx" ON "CodingSubmission"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "CodingLanguage_code_key" ON "CodingLanguage"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CodingProblem_slug_key" ON "CodingProblem"("slug");

-- CreateIndex
CREATE INDEX "CodingProblem_source_idx" ON "CodingProblem"("source");

-- CreateIndex
CREATE UNIQUE INDEX "CodingProblem_source_externalId_key" ON "CodingProblem"("source", "externalId");

-- AddForeignKey
ALTER TABLE "CodingTestCase" ADD CONSTRAINT "CodingTestCase_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "CodingProblem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSubmission" ADD CONSTRAINT "CodingSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSubmission" ADD CONSTRAINT "CodingSubmission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "CodingProblem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

