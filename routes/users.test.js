var app = require("../app")
var request = require("supertest")

test("Sign up - Body correct", async (done) => {
 await request(app).post('/signUp')
   .send({ firstName: "John", lastName: "Doe", phoneNumber: "0123456789", mail:"john.doe@gmail.com", favorites: ["0123456678", "987654321"] })
   .expect(200)
   .expect({ result: true, token: 10 });
 done();
});

