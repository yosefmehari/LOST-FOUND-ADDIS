import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import { createItemSchema, updateItemSchema, queryItemsSchema } from "./items.schema.js";
import { Role, ItemStatus, Prisma } from "@prisma/client";

export async function getItems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = queryItemsSchema.parse(req.query);
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    const where: Prisma.ItemWhereInput = {};

    // Filter by type (LOST / FOUND)
    if (filters.type) {
      where.type = filters.type;
    }

    // Filter by category
    if (filters.category && filters.category !== "All") {
      where.category = {
        equals: filters.category,
        mode: "insensitive",
      };
    }

    // Filter by status (Default to non-archived)
    if (filters.status) {
      where.status = filters.status;
    } else {
      where.status = { not: ItemStatus.ARCHIVED };
    }

    // Filter by location
    if (filters.location) {
      where.location = {
        contains: filters.location,
        mode: "insensitive",
      };
    }

    // Full-text-like search across title, description, and location
    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: "insensitive" } },
        { description: { contains: filters.query, mode: "insensitive" } },
        { location: { contains: filters.query, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          type: true,
          status: true,
          location: true,
          dateOccurred: true,
          imageUrl: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { claims: true },
          },
        },
      }),
      prisma.item.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getItemById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { claims: true },
        },
      },
    });

    if (!item || item.status === ItemStatus.ARCHIVED) {
      throw new AppError("Item not found", 404);
    }

    res.status(200).json({
      success: true,
      item,
    });
  } catch (error) {
    next(error);
  }
}

export async function getItemMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);

    const sourceItem = await prisma.item.findUnique({
      where: { id },
      select: { id: true, category: true, type: true, location: true, status: true },
    });

    if (!sourceItem) {
      throw new AppError("Item not found", 404);
    }

    // Look for opposite type (if source is LOST, look for FOUND)
    const oppositeType = sourceItem.type === "LOST" ? "FOUND" : "LOST";

    const matches = await prisma.item.findMany({
      where: {
        id: { not: sourceItem.id },
        type: oppositeType,
        status: ItemStatus.OPEN,
        category: sourceItem.category,
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        type: true,
        location: true,
        dateOccurred: true,
        imageUrl: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      disclaimer: "These are automated suggestions based on category and timing, not proof of ownership.",
      matches,
    });
  } catch (error) {
    next(error);
  }
}

export async function createItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const data = createItemSchema.parse(req.body);

    const item = await prisma.item.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        type: data.type,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        dateOccurred: data.dateOccurred ? new Date(data.dateOccurred) : new Date(),
        imageUrl: data.imageUrl || null,
        contactInfo: data.contactInfo || null,
        userId: req.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: `${data.type === "LOST" ? "Lost" : "Found"} item report created successfully`,
      item,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const id = String(req.params.id);
    const existing = await prisma.item.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError("Item not found", 404);
    }

    // Ownership check: must be owner or ADMIN
    if (existing.userId !== req.user.id && req.user.role !== Role.ADMIN) {
      throw new AppError("You do not have permission to modify this listing.", 403);
    }

    const data = updateItemSchema.parse(req.body);

    const updated = await prisma.item.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.type && { type: data.type }),
        ...(data.status && { status: data.status }),
        ...(data.location && { location: data.location }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.dateOccurred && { dateOccurred: new Date(data.dateOccurred) }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
        ...(data.contactInfo !== undefined && { contactInfo: data.contactInfo || null }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      item: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const id = String(req.params.id);
    const existing = await prisma.item.findUnique({
      where: { id },
      include: { _count: { select: { claims: true } } },
    });

    if (!existing) {
      throw new AppError("Item not found", 404);
    }

    if (existing.userId !== req.user.id && req.user.role !== Role.ADMIN) {
      throw new AppError("You do not have permission to delete this listing.", 403);
    }

    // If item has associated claims, archive it to preserve audit history
    if (existing._count.claims > 0) {
      await prisma.item.update({
        where: { id },
        data: { status: ItemStatus.ARCHIVED },
      });
      res.status(200).json({
        success: true,
        message: "Listing archived successfully (claims preserved)",
      });
      return;
    }

    // Otherwise permanently delete
    await prisma.item.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
