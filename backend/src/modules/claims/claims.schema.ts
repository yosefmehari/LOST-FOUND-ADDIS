import { z } from "zod";
import { ClaimStatus } from "@prisma/client";

export const createClaimSchema = z.object({
  message: z.string().trim().min(10, "Please provide sufficient details to verify ownership (at least 10 characters)").max(1500),
  verificationNotes: z.string().trim().max(1000).optional().nullable(),
});

export const updateClaimStatusSchema = z.object({
  status: z.enum([ClaimStatus.APPROVED, ClaimStatus.REJECTED]),
  verificationNotes: z.string().trim().max(1000).optional().nullable(),
});

export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type UpdateClaimStatusInput = z.infer<typeof updateClaimStatusSchema>;
