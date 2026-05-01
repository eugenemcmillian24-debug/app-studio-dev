import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";

/**
 * Setup script to grant admin access and free premium features to owner
 * Run this once to initialize the admin account
 */
async function setupAdmin() {
  const db = await getDb();
  
  if (!db) {
    console.error("Failed to connect to database");
    return;
  }

  const ownerEmail = process.env.OWNER_EMAIL || "admin@appstudio.com";
  const ownerName = process.env.OWNER_NAME || "Admin";
  const ownerOpenId = process.env.OWNER_OPEN_ID || "owner-id";

  try {
    console.log(`\n🔧 Setting up admin account for: ${ownerEmail}\n`);

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, ownerEmail))
      .limit(1);

    let userId: string;

    if (existingUser.length > 0) {
      // Update existing user to admin
      userId = existingUser[0].id.toString();
      console.log(`✅ User exists (ID: ${userId}), updating to admin role...`);

      await db
        .update(users)
        .set({
          role: "admin",
          updatedAt: new Date(),
        })
        .where(eq(users.email, ownerEmail));

      console.log("✅ User role updated to admin\n");
    } else {
      // Create new admin user
      console.log("📝 Creating new admin user...");

      const hashedPassword = await bcryptjs.hash("admin-password-change-me", 10);

      const result = await db
        .insert(users)
        .values({
          email: ownerEmail,
          name: ownerName,
          role: "admin",
          openId: ownerOpenId,
          passwordHash: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .$returningId();

      userId = result[0].id.toString();
      console.log(`✅ Admin user created (ID: ${userId})\n`);
    }

    // Grant free Pro subscription (via admin flag)
    console.log("🎁 Granting free Pro access with all features...");
    console.log("✅ Admin user granted free Pro access (all features unlocked)\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("✅ ADMIN SETUP COMPLETE!");
    console.log("═══════════════════════════════════════════════════════\n");
    console.log(`Admin Account Details:`);
    console.log(`  📧 Email: ${ownerEmail}`);
    console.log(`  👤 Name: ${ownerName}`);
    console.log(`  🔐 Role: admin`);
    console.log(`  💎 Plan: Pro (Free - All Features Unlocked)`);
    console.log(`\nUnlocked Features:`);
    console.log(`  ✓ Analytics Dashboard`);
    console.log(`  ✓ Marketplace`);
    console.log(`  ✓ Webhook Console`);
    console.log(`  ✓ Custom Domains`);
    console.log(`  ✓ Team Collaboration`);
    console.log(`  ✓ Export Formats`);
    console.log(`  ✓ All LLM Models (Free Tier)`);
    console.log(`  ✓ Unlimited Projects`);
    console.log(`  ✓ Unlimited Generations\n`);
    console.log("═══════════════════════════════════════════════════════\n");

  } catch (error) {
    console.error("❌ Error setting up admin:", error);
    throw error;
  }
}

// Run setup if executed directly
if (require.main === module) {
  setupAdmin()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { setupAdmin };
