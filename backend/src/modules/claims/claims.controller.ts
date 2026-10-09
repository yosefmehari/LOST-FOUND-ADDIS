import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import { createClaimSchema, updateClaimStatusSchema } from "./claims.schema.js";
import { Role, ClaimStatus, ItemStatus } from "@prisma/client";

export async function submitClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required to submit a claim", 401);
    }

    const itemId = String(req.params.itemId);
    const data = createClaimSchema.parse(req.body);

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, title: true, userId: true, status: true },
    });

    if (!item || item.status === ItemStatus.ARCHIVED) {
      throw new AppError("Item not found", 404);
    }

    // Safety rule: Cannot claim your own listing
    if (item.userId === req.user.id) {
      throw new AppError("You cannot submit a claim on your own listing.", 400);
    }

    // Safety rule: Can only claim items that are currently OPEN
    if (item.status !== ItemStatus.OPEN) {
      throw new AppError("This item has already been claimed or resolved.", 400);
    }

    // Check for duplicate claim
    const existingClaim = await prisma.claim.findUnique({
      where: {
        itemId_claimantId: {
          itemId,
          claimantId: req.user.id,
        },
      },
    });

    if (existingClaim) {
      throw new AppError("You have already submitted a claim on this item.", 409);
    }

    // Create the claim
    const claim = await prisma.claim.create({
      data: {
        itemId,
        claimantId: req.user.id,
        message: data.message,
        verificationNotes: data.verificationNotes || null,
        status: ClaimStatus.PENDING,
      },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    // Create a notification for the item owner
    await prisma.notification.create({
      data: {
        userId: item.userId,
        title: "New Claim Received",
        message: `Someone submitted an ownership claim for your listing: "${item.title}".`,
        linkUrl: `/dashboard?item=${item.id}`,
      },
    });

    res.status(201).json({
      success: true,
      message: "Claim submitted successfully. The finder will review your details.",
      claim,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyClaims(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const claims = await prisma.claim.findMany({
      where: { claimantId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            category: true,
            type: true,
            status: true,
            location: true,
            imageUrl: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      claims,
    });
  } catch (error) {
    next(error);
  }
}

export async function getItemClaims(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const itemId = String(req.params.itemId);

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, userId: true },
    });

    if (!item) {
      throw new AppError("Item not found", 404);
    }

    // Only the owner of the listing or an ADMIN may view incoming claims
    if (item.userId !== req.user.id && req.user.role !== Role.ADMIN) {
      throw new AppError("Unauthorized. You do not own this listing.", 403);
    }

    const claims = await prisma.claim.findMany({
      where: { itemId },
      orderBy: { createdAt: "desc" },
      include: {
        claimant: {
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
      claims,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateClaimStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const id = String(req.params.id);
    const data = updateClaimStatusSchema.parse(req.body);

    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            userId: true,
            type: true,
          },
        },
      },
    });

    if (!claim) {
      throw new AppError("Claim not found", 404);
    }

    // Only the item owner or ADMIN can approve/reject the claim
    if (claim.item.userId !== req.user.id && req.user.role !== Role.ADMIN) {
      throw new AppError("Unauthorized. Only the listing owner can resolve claims.", 403);
    }

    const updatedClaim = await prisma.claim.update({
      where: { id },
      data: {
        status: data.status,
        reviewerId: req.user.id,
        ...(data.verificationNotes && { verificationNotes: data.verificationNotes }),
      },
    });

    // If claim is APPROVED, update the item's status to CLAIMED
    if (data.status === ClaimStatus.APPROVED) {
      await prisma.item.update({
        where: { id: claim.item.id },
        data: { status: ItemStatus.CLAIMED },
      });
    }

    // Send notification to the claimant
    await prisma.notification.create({
      data: {
        userId: claim.claimantId,
        title: data.status === ClaimStatus.APPROVED ? "Claim Approved! 🎉" : "Claim Status Update",
        message:
          data.status === ClaimStatus.APPROVED
            ? `Your claim for "${claim.item.title}" was approved by the reporter.`
            : `Your claim for "${claim.item.title}" was not approved.`,
        linkUrl: `/dashboard`,
      },
    });

    res.status(200).json({
      success: true,
      message: `Claim ${data.status.toLowerCase()} successfully`,
      claim: updatedClaim,
    });
  } catch (error) {
    next(error);
  }
}
