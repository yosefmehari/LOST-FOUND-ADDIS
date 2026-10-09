import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import { createReportSchema, updateReportStatusSchema } from "./reports.schema.js";
import { ReportStatus } from "@prisma/client";

export async function submitReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required to report an item", 401);
    }

    const itemId = String(req.params.id);
    const data = createReportSchema.parse(req.body);

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new AppError("Item not found", 404);
    }

    const report = await prisma.report.create({
      data: {
        itemId,
        reporterId: req.user.id,
        reason: data.reason,
        details: data.details || null,
        status: ReportStatus.PENDING,
      },
    });

    res.status(201).json({
      success: true,
      message: "Report submitted. Moderators will review this listing.",
      report,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminReports(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            type: true,
            category: true,
            status: true,
            location: true,
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateReportStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const data = updateReportStatusSchema.parse(req.body);

    const report = await prisma.report.update({
      where: { id },
      data: { status: data.status },
    });

    res.status(200).json({
      success: true,
      message: `Report marked as ${data.status.toLowerCase()}`,
      report,
    });
  } catch (error) {
    next(error);
  }
}
