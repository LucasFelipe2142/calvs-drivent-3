import app, { init } from "@/app";
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { createEnrollmentWithAddress, createUser, createTicket, createTicketType } from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
  await cleanDb();
});

const server = supertest(app);

describe("GET /hotels", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/hotels");
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  //------------------------------------------------------------------------------------------------

  describe("when token is valid", () => {
    it("should respond with status 404 when tickek is remote, doesn't include an hotel or hotel is unpaid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const userEnrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(true, false);
      await createTicket(userEnrollment.id, ticketType.id, TicketStatus.RESERVED);

      const result = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
			
      expect(result.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with [] when there aren't created hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const userEnrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(userEnrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.body).toEqual([]);
    });

    it("should respond with status 200 and Hotel data", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const userEnrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(userEnrollment.id, ticketType.id, TicketStatus.PAID);
      await prisma.hotel.create({
        data: {
          name: "Golden Dolphin Hotéis",
          image: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fgoldendolphin.com.br%2F&psig=AOvVaw12i9UDL1B8wTphhFgoOP61&ust=1669694618681000&source=images&cd=vfe&ved=0CBAQjRxqFwoTCODz8Kb_z_sCFQAAAAAdAAAAABAE"
        }
      });

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            image: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          })
        ])
      );
    });
  });
});

//------------------------------------------------------------------------------------------------

describe("GET /hotels/:hotelId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/hotels");
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 when tickek is remote, doesn't include an hotel or hotel is unpaid", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const userEnrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(true, false);
      await createTicket(userEnrollment.id, ticketType.id, TicketStatus.RESERVED);

      const result = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
			
      expect(result.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 when hotelId does not exist", async () => {
      const token = await generateValidToken();

      const result = await server.get("/hotels/0").set("Authorization", `Bearer ${token}`);
      expect(result.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 and with rooms data", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const userEnrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(userEnrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await prisma.hotel.create({
        data: {
          name: "Golden Dolphin Hotéis",
          image: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fgoldendolphin.com.br%2F&psig=AOvVaw12i9UDL1B8wTphhFgoOP61&ust=1669694618681000&source=images&cd=vfe&ved=0CBAQjRxqFwoTCODz8Kb_z_sCFQAAAAAdAAAAABAE"
        }
      });

      const room = await prisma.room.create({
        data: {
          name: "Quarto 01",
          capacity: 5,
          hotelId: hotel.id,
        }
      });

      const result = await server.get(`/hotels/${room.hotelId}`).set("Authorization", `Bearer ${token}`);

      expect(result.status).toEqual(httpStatus.OK);
      expect(result.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            capacity: expect.any(Number),
            Hotel: {
              id: expect.any(Number),
              name: expect.any(String),
              image: expect.any(String),
              createdAt: expect.any(String),
              updatedAt: expect.any(String)
            },
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          })
        ])
      );
    });
  });
});
