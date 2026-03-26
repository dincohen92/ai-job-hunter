-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "location" TEXT,
    "description" TEXT,
    "culture" TEXT,
    "techStack" TEXT,
    "glassdoor" TEXT,
    "linkedin" TEXT,
    "notes" TEXT,
    "pros" TEXT,
    "cons" TEXT,
    "salaryRange" TEXT,
    "interviewProcess" TEXT,
    "isTarget" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Company" ("cons", "createdAt", "culture", "description", "glassdoor", "id", "industry", "interviewProcess", "linkedin", "location", "name", "notes", "pros", "salaryRange", "size", "techStack", "updatedAt", "userId", "website") SELECT "cons", "createdAt", "culture", "description", "glassdoor", "id", "industry", "interviewProcess", "linkedin", "location", "name", "notes", "pros", "salaryRange", "size", "techStack", "updatedAt", "userId", "website" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE INDEX "Company_userId_idx" ON "Company"("userId");
CREATE INDEX "Company_userId_isTarget_idx" ON "Company"("userId", "isTarget");
CREATE UNIQUE INDEX "Company_userId_name_key" ON "Company"("userId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
