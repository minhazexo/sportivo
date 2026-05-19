import { Prisma } from '@prisma/client'

const prisma = new Prisma({
  // Use this for direct database connection
  // adapter: {
  //   url: process.env.Neon_CONNECTION_STRING,
  // },
  
  // Or use the client constructor directly
  // For now, we'll pass the connection in the client instantiation
})

export default prisma

// Or simply: export default new Prisma()