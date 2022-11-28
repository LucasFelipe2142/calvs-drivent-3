import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { getHotels, getHotelsByHotelId } from "@/controllers";

const hotelsRouter = Router();

hotelsRouter
  .get("/", authenticateToken, getHotels)
  .get("/:hotelId", authenticateToken, getHotelsByHotelId);

export { hotelsRouter };
