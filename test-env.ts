import path from "path";
import dotenv from "dotenv";
console.log("From prisma.config:", path.resolve(process.cwd(), "packages/database", "../../.env"));
console.log("From client.ts:", path.resolve(process.cwd(), "packages/database/src", "../../../.env"));
