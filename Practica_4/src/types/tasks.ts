import { ObjectId } from "mongodb"

export type Tasks = {
    _id: ObjectId,
    title: String,
    projectId: string[],
    assignedTo: string[],
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED",
    priority: "LOW" | "MEDIUM" | "HIGH",
    dueDate: Date, 
}