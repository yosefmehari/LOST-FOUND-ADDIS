import { z } from "zod";
import { ReportStatus } from "@prisma/client";

export const createReportSchema = z.object({
  reason: z.string().trim().min(3, "Reason must be at least 3 characters long").max(100),
  details: z.string().trim().max(1000).optional().nullable(),
});

export const updateReportStatusSchema = z.object({
  status: z.enum([ReportStatus.RESOLVED, ReportStatus.DISMISSED]),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;
