//Imports basics
import { ObjectId } from "mongodb";
import { getDB } from "../db/mongo"
import { IResolvers } from "@graphql-tools/utils";

//Import types
import { Projects } from "../types/projects";
import { User } from "../types/users";
import { Tasks } from "../types/tasks";
import { tokenPayload } from "../types/auth";


//Import utils
import { createUser, validateUser } from "../utils/users";
import { signToken } from "../utils/auth";

//Import environment variables
import dotenv from "dotenv";
import { get } from "http";

dotenv.config();

export const resolvers: IResolvers = {
    Query: {//No funciona ninguna query

       //Devolvera los projectos dnd el usuario que se pasa es owner o member 
       myProjects: async (_, __, ctx) => {
        const user = ctx.user;
        if(!user) throw new Error("Not authenticated");

        const db = getDB();
        
        return await db.collection<Projects>(process.env.COLLECTION_NAME_P!).find().toArray();

       },

       //Devuelve el contenido conmpleto del ID del proyecto que se ha puesto
       projectDetails: async(_, {id} : {id: string}, ctx) => {
        const user = ctx.user;
        if(!user) throw new Error("Not authenticated");
        
        const db = getDB();

        return await db.collection<Projects>(process.env.COLLECTION_NAME_P!).find({ _id: new ObjectId(id) }).toArray();
       },

       //Devuelve una lista de usuarios para poder buscarlos
       users: async(_, __, ctx) => {
        const user = ctx.user;
        if(!user) throw new Error("Not authenticated");

        const db = getDB();

        //Solo hay que devolver el array de IDS
        return await db.collection<User>(process.env.COLLECTION_NAME_U!).find().toArray();
        
        
        }
    },

    Projects: {
        owner: async (parent: Projects) : Promise<User> => {
            const db = getDB();
            const userId = parent.owner;
            return db
            .collection<User>(process.env.COLLECTION_NAME_U!)
            .findOne({_id : new ObjectId(userId)}) as Promise<User>;
        },

    },

    Tasks: {

    },

    Mutation: {
        //Funciona
        register: async (_,{input} : {input: {email: string, password: string, username: string}} ) => {
            console.log("Registering user:", input.email);
            const user = await createUser(input.email, input.password, input.username);
            return {
                token: signToken(user._id.toString()),
                user,
            }
        },

        //Funciona
        login: async (_, {input} : {input: {email: string, password: string, username: string}} ) => {
            const user = await validateUser(input.email, input.password, input.username);
            if(!user) throw new Error("Invalid credentials");
            return {
                token: signToken(user._id.toString()),
                user,
            }
        },

        //No funciona :)
        createProject: async (_, {input} : {input: {name: string, description?: string, startDate: string, endDate: string, owner: string, members: string[], tasks: string[]}}, {ctx} ) => {
             const user = ctx.user;
            if(!user) throw new Error("Not authenticated");

            console.log("UserId pasado:", user._id.toString());
            
            const db = getDB();
            const result = await db.collection<Projects>(process.env.COLLECTION_NAME_P!).insertOne({
                _id : new ObjectId(),
                name: input.name,
                description: input.description || "",
                startDate: new Date(input.startDate),
                endDate: new Date(input.endDate),
                owner : user._id.toString(),
                members: [input.members.toString()],
                tasks: [input.tasks.toString()]
            
            });

            const project = await db.collection<Projects>(process.env.COLLECTION_NAME_P!).findOne({ _id: result.insertedId });
            if(!project) throw new Error("Error creating project");
            return project;
        }


        
    },
};