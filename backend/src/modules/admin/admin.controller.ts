import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";

export async function getAdminStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [totalUsers, totalItems, totalClaims, pendingClaims, itemsByType] = await Promise.all([
      prisma.user.count(),
      prisma.item.count(),
      prisma.claim.count(),
      prisma.claim.count({ where: { status: "PENDING" } }),
      prisma.item.groupBy({
        by: ["type"],
        _count: true,
      }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalItems,
        totalClaims,
        pendingClaims,
        itemsByType,
      },
    });
  } catch (error) {
    next(error);
  }
}
