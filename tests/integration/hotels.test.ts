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

// describe("GET /enrollments/cep", () => {
//   it("should respond with status 200 when CEP is valid", async () => {
//     const response = await server.get("/enrollments/cep?cep=04538132");
//     const address = createhAddressWithCEP();

//     expect(response.status).toBe(httpStatus.OK);
//     expect(response.body).toEqual(address);
//   });
//   it("should respond with status 204 when CEP is valid", async () => {
//     const response = await server.get("/enrollments/cep?cep=00");

//     expect(response.status).toBe(httpStatus.NO_CONTENT);
//   });
// });

// describe("POST /enrollments", () => {
//   it("should respond with status 401 if no token is given", async () => {
//     const response = await server.post("/enrollments");

//     expect(response.status).toBe(httpStatus.UNAUTHORIZED);
//   });

//   it("should respond with status 401 if given token is not valid", async () => {
//     const token = faker.lorem.word();

//     const response = await server.post("/enrollments").set("Authorization", `Bearer ${token}`);

//     expect(response.status).toBe(httpStatus.UNAUTHORIZED);
//   });

//   it("should respond with status 401 if there is no session for given token", async () => {
//     const userWithoutSession = await createUser();
//     const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

//     const response = await server.post("/enrollments").set("Authorization", `Bearer ${token}`);

//     expect(response.status).toBe(httpStatus.UNAUTHORIZED);
//   });

//   describe("when token is valid", () => {
//     it("should respond with status 400 when body is not present", async () => {
//       const token = await generateValidToken();

//       const response = await server.post("/enrollments").set("Authorization", `Bearer ${token}`);

//       expect(response.status).toBe(httpStatus.BAD_REQUEST);
//     });

//     it("should respond with status 400 when body is not valid", async () => {
//       const token = await generateValidToken();
//       const body = { [faker.lorem.word()]: faker.lorem.word() };

//       const response = await server.post("/enrollments").set("Authorization", `Bearer ${token}`).send(body);

//       expect(response.status).toBe(httpStatus.BAD_REQUEST);
//     });

//     describe("when body is valid", () => {
//       const generateValidBody = () => ({
//         name: faker.name.findName(),
//         cpf: generateCPF(),
//         birthday: faker.date.past().toISOString(),
//         phone: "(21) 98999-9999",
//         address: {
//           cep: "90830-563",
//           street: faker.address.streetName(),
//           city: faker.address.city(),
//           number: faker.datatype.number().toString(),
//           state: faker.helpers.arrayElement(getStates()).code,
//           neighborhood: faker.address.secondaryAddress(),
//           addressDetail: faker.lorem.sentence(),
//         },
//       });

//       it("should respond with status 201 and create new enrollment if there is not any", async () => {
//         const body = generateValidBody();
//         const token = await generateValidToken();

//         const response = await server.post("/enrollments").set("Authorization", `Bearer ${token}`).send(body);

//         expect(response.status).toBe(httpStatus.OK);
//         const enrollment = await prisma.enrollment.findFirst({ where: { cpf: body.cpf } });
//         expect(enrollment).toBeDefined();
//       });

//       it("should respond with status 200 and update enrollment if there is one already", async () => {
//         const user = await createUser();
//         const enrollment = await createEnrollmentWithAddress(user);
//         const body = generateValidBody();
//         const token = await generateValidToken(user);

//         const response = await server.post("/enrollments").set("Authorization", `Bearer ${token}`).send(body);

//         expect(response.status).toBe(httpStatus.OK);
//         const updatedEnrollment = await prisma.enrollment.findUnique({ where: { userId: user.id } });
//         const addresses = await prisma.address.findMany({ where: { enrollmentId: enrollment.id } });
//         expect(addresses.length).toEqual(1);
//         expect(updatedEnrollment).toBeDefined();
//         expect(updatedEnrollment).toEqual(
//           expect.objectContaining({
//             name: body.name,
//             cpf: body.cpf,
//             birthday: dayjs(body.birthday).toDate(),
//             phone: body.phone,
//           }),
//         );
//       });
//     });

//     describe("when body is invalid", () => {
//       const generateInvalidBody = () => ({
//         name: faker.name.findName(),
//         cpf: generateCPF(),
//         birthday: faker.date.past().toISOString(),
//         phone: "(21) 98999-9999",
//         address: {
//           cep: "0",
//           street: faker.address.streetName(),
//           city: faker.address.city(),
//           number: faker.datatype.number().toString(),
//           state: faker.helpers.arrayElement(getStates()).code,
//           neighborhood: faker.address.secondaryAddress(),
//           addressDetail: faker.lorem.sentence(),
//         },
//       });

//       it("should respond with status 400 and create new enrollment if there is not any", async () => {
//         const body = generateInvalidBody();
//         const token = await generateValidToken();

//         const response = await server.post("/enrollments").set("Authorization", `Bearer ${token}`).send(body);

//         expect(response.status).toBe(httpStatus.BAD_REQUEST);
//       });
//     });
//   });
// });
