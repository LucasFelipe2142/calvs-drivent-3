import { notFoundError } from "@/errors";
import ticketRepository from "@/repositories/ticket-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import hotelRepository from "@/repositories/hotels-repository";

async function getHotels(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw notFoundError();
  }
  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) {
    throw notFoundError();
  }
  if (ticket.status !== "PAID") throw notFoundError();

  const hotels = await hotelRepository.findHotel();

  if (!hotels) {
    throw notFoundError();
  }

  return hotels;
}

async function getHotelsByHotelId(hotelId: number) {
  const hotels = await hotelRepository.findHotelByHotelId(hotelId);

  if (!hotels) {
    throw notFoundError();
  }

  return hotels;
}

async function validateHotelId(hotelId: number) {
  const hotel = await hotelRepository.validateHotelId(hotelId);
  if(!hotel) throw notFoundError();
	
  return hotel;
}

const enrollmentsService = {
  getHotels,
  getHotelsByHotelId,
  validateHotelId
};

export default enrollmentsService;
