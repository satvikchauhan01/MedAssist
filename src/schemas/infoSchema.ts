import * as z from "zod";

export const infoSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long").max(50, "Name must be at most 20 characters long"),
    age: z.number().min(0, "Age must be at least 0").optional(),
    weight: z.number().max(500, "Weight must be at most 500").optional(),
    gender: z.enum(["male", "female", "others"]),
    role: z.enum(["user", "doctor"]),
    specialization: z.string().optional(),  // add (only required if doctor)
}).refine((data) => {
    if (data.role === "doctor" && !data.specialization) {
        return false;  // specialization required if doctor
    }
    return true;
}, {
    message: "Specialization is required for doctors",
    path: ["specialization"]
});
