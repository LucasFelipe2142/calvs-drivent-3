import { prisma } from "@/config";

async function findHotel() {
  const hotel = await prisma.hotel.findMany();
  return hotel;
}

async function findHotelByHotelId(hotelId: number) {
  return prisma.hotel.findFirst({
    where: {
      id: hotelId,
    }
  });
}

const paymentRepository = {
  findHotel,
  findHotelByHotelId,
};

export default paymentRepository;
