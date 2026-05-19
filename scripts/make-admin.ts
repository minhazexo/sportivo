import prisma from '../src/lib/prisma';

// ANSI escape codes for coloring
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

async function printHeader() {
  console.log(`\n${COLORS.bright}${COLORS.cyan}===============================================`);
  console.log(`         SPORTIVO USER ROLE MANAGER            `);
  console.log(`===============================================${COLORS.reset}\n`);
}

async function listUsers() {
  await printHeader();
  console.log(`${COLORS.bright}Fetching registered users from Neon Database...${COLORS.reset}`);
  
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (users.length === 0) {
      console.log(`\n${COLORS.yellow}⚠️ No users found in the database.${COLORS.reset}`);
      console.log(`Please sign in on the web application first so that your account is registered in Neon.`);
      return;
    }

    console.log(`\n${COLORS.bright}Registered Users (${users.length}):${COLORS.reset}`);
    console.log(`-----------------------------------------------------------------------------------------------`);
    console.log(
      `${COLORS.bright}${'Name'.padEnd(20)} | ${'Email'.padEnd(30)} | ${'Role'.padEnd(10)} | ${'Firebase UID'.padEnd(30)}${COLORS.reset}`
    );
    console.log(`-----------------------------------------------------------------------------------------------`);
    
    users.forEach(user => {
      let roleColor = COLORS.reset;
      if (user.role === 'admin') roleColor = COLORS.red + COLORS.bright;
      else if (user.role === 'editor') roleColor = COLORS.green + COLORS.bright;

      const name = user.displayName || 'No Name';
      const email = user.email;
      const role = user.role;
      const uid = user.id;

      console.log(
        `${name.padEnd(20)} | ${email.padEnd(30)} | ${roleColor}${role.padEnd(10)}${COLORS.reset} | ${uid.padEnd(30)}`
      );
    });
    console.log(`-----------------------------------------------------------------------------------------------\n`);
    console.log(`${COLORS.bright}Commands available:${COLORS.reset}`);
    console.log(`  npx tsx scripts/make-admin.ts promote <email-or-uid>`);
    console.log(`  npx tsx scripts/make-admin.ts demote <email-or-uid>\n`);
  } catch (error) {
    console.error(`\n${COLORS.red}❌ Error fetching users:${COLORS.reset}`, error);
  } finally {
    await prisma.$disconnect();
  }
}

async function updateRole(action: 'promote' | 'demote', target: string) {
  await printHeader();
  
  const role = action === 'promote' ? 'admin' : 'user';
  console.log(`Attempting to set role of ${COLORS.cyan}${target}${COLORS.reset} to ${COLORS.bright}${role === 'admin' ? COLORS.red : COLORS.green}${role}${COLORS.reset}...`);

  try {
    // Try to find user by email first, then by UID
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: target },
          { id: target }
        ]
      }
    });

    if (!user) {
      console.log(`\n${COLORS.red}❌ Error: User with Email or UID "${target}" was not found in the Neon database.${COLORS.reset}`);
      console.log(`\n${COLORS.yellow}💡 Tips:${COLORS.reset}`);
      console.log(`1. Make sure you signed in on the frontend (http://localhost:3000) using your Google account.`);
      console.log(`2. Signing in automatically registers your account in the Neon PostgreSQL database.`);
      console.log(`3. Check for any connection errors in your server.ts terminal.`);
      console.log(`4. Run ${COLORS.cyan}npx tsx scripts/make-admin.ts${COLORS.reset} without arguments to list all registered users.\n`);
      return;
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role }
    });

    console.log(`\n${COLORS.green}✅ Success! User role updated successfully:${COLORS.reset}`);
    console.log(`------------------------------------------------------`);
    console.log(`Name:        ${updatedUser.displayName || 'N/A'}`);
    console.log(`Email:       ${updatedUser.email}`);
    console.log(`Firebase ID: ${updatedUser.id}`);
    console.log(`Old Role:    ${COLORS.yellow}${user.role}${COLORS.reset}`);
    console.log(`New Role:    ${role === 'admin' ? COLORS.red + COLORS.bright : COLORS.green}${updatedUser.role}${COLORS.reset}`);
    console.log(`------------------------------------------------------\n`);
    
    console.log(`${COLORS.green}🎉 Done! You can now log in/refresh the app to access the Admin Panel.${COLORS.reset}\n`);
  } catch (error) {
    console.error(`\n${COLORS.red}❌ Error updating user role:${COLORS.reset}`, error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    await listUsers();
    return;
  }

  const action = args[0].toLowerCase();
  
  if (action === 'promote' || action === 'demote') {
    if (args.length < 2) {
      console.log(`\n${COLORS.red}❌ Error: Please specify the user's email or UID.${COLORS.reset}`);
      console.log(`Example: npx tsx scripts/make-admin.ts promote user@example.com\n`);
      return;
    }
    await updateRole(action as 'promote' | 'demote', args[1]);
  } else {
    console.log(`\n${COLORS.red}❌ Error: Unknown action "${action}".${COLORS.reset}`);
    console.log(`Usage:`);
    console.log(`  npx tsx scripts/make-admin.ts`);
    console.log(`  npx tsx scripts/make-admin.ts promote <email-or-uid>`);
    console.log(`  npx tsx scripts/make-admin.ts demote <email-or-uid>\n`);
  }
}

main();
