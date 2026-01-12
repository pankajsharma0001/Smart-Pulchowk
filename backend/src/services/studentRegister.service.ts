import { students } from "../models/event-schema.js";
import { StudentInput } from "../types/studentRegister.js";
import { db } from "../lib/db.js";
import { eq } from "drizzle-orm";

export async function createStudentProfile(data: StudentInput){
    
try{ 

 const existingUser = await db.query.students.findFirst({
    where: eq(students.authStudentId, data.authStudentId )
 })
if(existingUser){
    console.log("existing user")
    return;
}

    await db.insert(students).values(data);
}catch(error){
    console.log(error.message);
}
}


export async function getStudentProfile(authStudentId: string){
    const [student] = await db .select().from(students).where(eq(students.authStudentId, authStudentId));
    return student;
}
