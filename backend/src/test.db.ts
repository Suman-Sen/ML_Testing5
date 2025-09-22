import { PrismaClient } from "../prisma/generated/prisma";

const prisma = new PrismaClient()
const main=async()=>{
    const  count = await prisma.user.count()
    console.log(`count ${count}`)
}

main();