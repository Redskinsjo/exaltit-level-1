const { existsSync, mkdirSync, readdir, writeFileSync } = require("fs");
const { get } = require("https");
const { access, readFileSync } = require("node:fs");

const endpoints = [
  "https://recrutement-practice-default-rtdb.firebaseio.com/informations.json",
  "https://recrutement-practice-default-rtdb.firebaseio.com/jobs.json",
  "https://recrutement-practice-default-rtdb.firebaseio.com/users.json",
];

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const createBackupsJson = () => {
  endpoints.forEach((path) => {
    const req = get(path, (res) => {
      res.on("data", (chunk) => {
        // get file name
        const regex = new RegExp(/(?<=.com\/)[a-z]{1,}.json/, "g", "i");
        const fileName = path.match(regex);
        // access file
        access("./json/" + fileName, (err) => {
          if (err) {
            // check if folder exists otherwise create it
            if (!existsSync(__dirname + "/json")) {
              mkdirSync(__dirname + "/json");
            }
            // check if file exists otherwise create it
            if (!existsSync(__dirname + "/json/" + fileName)) {
              writeFileSync(__dirname + "/json/" + fileName, chunk);
              return;
            }
          }
        });
      });
    });
    req.end();
  });
};

const compileAllFiles = () => {
  access(__dirname + "/json", (err) => {
    // if 'json' folder exists, run this
    if (!err) {
      // read this folder and group in 'let compiledData' its files content
      readdir(__dirname + "/json", null, (err, files) => {
        let compiledData = {};
        const sortedFiles = sortFiles(files);
        sortedFiles.forEach((file) => {
          const response = readFileSync(__dirname + "/json/" + file);
          if (response) {
            const parsedData = JSON.parse(response);
            for (let id in parsedData) {
              const cleanData = sanitizeData(parsedData[id], compiledData[id]);
              if (compiledData[id]) {
                // console.log(compiledData);
                compiledData[id] = {
                  ...compiledData[id],
                  ...cleanData,
                };
              } else {
                compiledData[id] = cleanData;
              }
            }
          }
        });
        // create output file as compiled file
        const stringifiedData = JSON.stringify(compiledData);
        if (stringifiedData) {
          if (!existsSync(__dirname + "/out")) {
            mkdirSync(__dirname + "/out");
          }
          if (!existsSync(__dirname + "/out/result.json")) {
            writeFileSync(__dirname + "/out/result.json", stringifiedData);
            return;
          }
        }
      });
    }
  });
};

const sanitizeData = (originData, sanitizedData) => {
  const inData = originData;
  const outData = sanitizedData;

  let cleanData = {};
  for (let key in inData) {
    // used conditionning technique, no other possibility with use of a new object 'cleanData'
    if (inData[key] !== null || inData[key] !== undefined) {
      if (key === "name" && inData.name !== "#ERROR") {
        if (outData) {
          if (!outData[key]) {
            cleanData.name = formatName(inData.name);
          }
        } else {
          cleanData.name = formatName(inData.name);
        }
      }
      if (key === "city") {
        if (outData) {
          if (!outData[key]) {
            cleanData.city = formatCity(inData.city);
          }
        } else {
          cleanData.city = formatCity(inData.city);
        }
      }
      if (key !== "name" && key !== "city") {
        if (outData) {
          if (!outData[key]) {
            cleanData[key] = inData[key];
          }
        } else {
          cleanData[key] = inData[key];
        }
      }
    }
  }
  return cleanData;
};

const formatName = (name) => {
  const mapping = { 3: "e", 4: "a", 1: "i", 0: "o" };
  return name
    .split("")
    .map((letter, index) =>
      index === 0 && mapping[letter]
        ? mapping[letter].toUpperCase()
        : mapping[letter]
        ? mapping[letter]
        : letter
    )
    .join("");
};

const formatCity = (city) => {
  return city[0].toUpperCase() + city.slice(1).toLowerCase();
};

const sortFiles = (files) => {
  return files.sort((a, b) => {
    if (a === "jobs.json") {
      return 1;
    } else if (b === "jobs.json" || a === "users.json") {
      return -1;
    } else {
      return 0;
    }
  });
};

(async function () {
  createBackupsJson();
  await sleep(500);
  compileAllFiles();
})();
