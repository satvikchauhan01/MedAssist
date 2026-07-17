import * as z from "zod";

export const medicineSchema = z.object({
    name:z.string().min(2,"Name must be at least 2 characters long").max(100,"Name must be at most 100 characters long"),
    description:z.string().min(10,"Description must be at least 10 characters long").max(1000,"Description must be at most 1000 characters long"),
    price:z.number().min(0,"Price must be at least 0").max(10000,"Price must be at most 10000"),
    imageUrl:z.string().url("Image URL must be a valid URL"),
})

export const medicineFormSchema = medicineSchema.extend({
    image: z.any()
        .refine((file) => file instanceof File, "Image is required")
        .refine((file) => file?.size <= 5000000, "Max file size is 5MB")
        .refine(
            (file) => ["image/jpeg", "image/png", "image/webp"].includes(file?.type),
            "Only .jpg, .png and .webp formats are supported"
        ),
}).omit({imageUrl:true})
.extend({
    image:z.any().optional()
}); // we generate imageUrl on the backend 