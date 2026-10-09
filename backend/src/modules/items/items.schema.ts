import { z } from "zod";
import { ItemType, ItemStatus } from "@prisma/client";

export const createItemSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters long").max(120),
  description: z.string().trim().min(10, "Description must be at least 10 characters long").max(2000),
  category: z.string().trim().min(2, "Category is required"),
  type: z.enum([ItemType.LOST, ItemType.FOUND]),
  location: z.string().trim().min(2, "Location is required (e.g., Bole, Arat Kilo, Piazza)"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  dateOccurred: z.string().optional(),
  imageUrl: z.string().url("Image URL must be a valid URL").optional().nullable().or(z.literal("")),
  contactInfo: z.string().trim().max(200).optional().nullable(),
});

export const updateItemSchema = createItemSchema.partial().extend({
  status: z.enum([ItemStatus.OPEN, ItemStatus.CLAIMED, ItemStatus.RETURNED, ItemStatus.ARCHIVED]).optional(),
});

export const queryItemsSchema = z.object({
  query: z.string().trim().optional(),
  type: z.enum([ItemType.LOST, ItemType.FOUND]).optional(),
  category: z.string().trim().optional(),
  status: z.enum([ItemStatus.OPEN, ItemStatus.CLAIMED, ItemStatus.RETURNED, ItemStatus.ARCHIVED]).optional(),
  location: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type QueryItemsInput = z.infer<typeof queryItemsSchema>;
