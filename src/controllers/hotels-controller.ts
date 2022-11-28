import { AuthenticatedRequest } from "@/middlewares";
import hotelServices from "../services/hotels-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getHotels(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const hotels = await hotelServices.getHotels(userId);

    return res.status(httpStatus.OK).send(hotels);
  } catch (error) {
    if(error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    } else if (error.name === "UnauthorizerError") {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    } else if (error.name === "BadRequestError") {
      return res.sendStatus(httpStatus.BAD_REQUEST);
    } else {
      return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

export async function getHotelsByHotelId(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const hotelId = Number(req.params.hotelId);

  try {
    const hotelByHotelId = await hotelServices.getHotelsByHotelId(hotelId);

    return res.status(httpStatus.OK).send(hotelByHotelId);
  } catch (error) {
    return res.sendStatus(httpStatus.NO_CONTENT);
  }
}
