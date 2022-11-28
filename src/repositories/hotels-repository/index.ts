import { prisma } from "@/config";

async function findHotel() {
  const hotel = await prisma.hotel.findMany();
  return hotel;
}

async function findHotelByHotelId(hotelId: number) {
  const rooms = await prisma.room.findMany({
    where: {
      hotelId
    },
    include: {
      Hotel: true
    }
  });
  return rooms;
}

async function validateHotelId(hotelId: number) {
  const validateHotelId = await prisma.hotel.findFirst({
    where: {
      id: hotelId
    }
  });
  return validateHotelId;
}

const paymentRepository = {
  findHotel,
  findHotelByHotelId,
  validateHotelId,
};

export default paymentRepository;
