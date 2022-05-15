const data = require("./results.json");
const fs = require("fs");

describe("exaltIT", () => {
  let verifiedResults;

  beforeAll(async () => {
    const response = fs.readFileSync(__dirname + "/results.json");
    verifiedResults = JSON.parse(response);
  });

  it("compare results", async () => {
    const response = fs.readFileSync(__dirname + "/out/result.json");
    const myResult = JSON.parse(response);

    for (let id in myResult) {
      for (let key in myResult[id]) {
        expect(myResult[id][key]).toEqual(verifiedResults[id][key]);
      }
    }
  });
});
