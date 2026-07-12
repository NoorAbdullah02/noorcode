import { db } from "./packages/database/src/client.ts";

async function main() {
  try {
    const s = await db.session.create({
      data: {
        title: "Test",
        autoProceed: true,
        userId: "test-user"
      }
    });
    console.log("Success:", s.id);
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
