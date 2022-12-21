const axios = require("axios");
const fs = require("fs");
const cheerio = require("cheerio");

async function translate(text, language) {
  let res = await axios.post(
    `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
    { q: text, target: language }
  );
  let translation = res.data.data.translations[0].translatedText;
  return translation;
}

function isResxFile(file) {
  const fileExtension = file.split(".").pop();
  return fileExtension === "resx";
}

function isCsFile(file) {
  const fileExtension = file.split(".").pop();
  return fileExtension === "cs";
}

function createCsFile(route, language) {
  const ending = route.split(".").pop();
  const originalFilename = route.split("/").pop();
  const originalFileWithoutEnding = originalFilename.split(".").slice(0, -1);
  let contents = fs.readFileSync(route).toString();
  contents = contents.replace(
    `Resources.${originalFileWithoutEnding[0]}`,
    `Resources.${originalFileWithoutEnding[0]}.${language}`
  );
  const fileRoute = route.replace(
    originalFilename,
    `${originalFileWithoutEnding.join(".")}.${language}.${ending}`
  );
  fs.writeFileSync(fileRoute, contents);
}

function isTranslatedFile(file) {
  if (isResxFile(file)) {
    const splits = file.split(".");
    return splits.length === 3 && languages.includes(splits[1]);
  }
  if (isCsFile(file)) {
    const splits = file.split(".");
    return splits.length === 4 && languages.includes(splits[2]);
  }
}

function removeAllPreviouslyTranslatedFiles() {
  for (let route of routes) {
    var files = fs.readdirSync(route);
    for (let file of files) {
      if (isTranslatedFile(file)) {
        console.log(`removing ${route}/${file}`);
        fs.unlinkSync(`${route}/${file}`);
      }
    }
  }
}

async function translateFreshResxFile(route, language) {
  const routeWithoutEnding = route.split(".").slice(0, -1).join(".");
  const destinationRoute = `${routeWithoutEnding}.${language}.resx`;

  const xml = fs.readFileSync(route).toString();
  const $ = cheerio.load(xml, {
    xmlMode: true,
  });
  const valuesToTranslate = $("data").find("value");
  console.log(
    `translating ${valuesToTranslate.length} values to ${language} in ${route}`
  );
  for (let valueXml of valuesToTranslate) {
    const value = $(valueXml).text();
    const translation = await translate(value, language);
    $(valueXml).text(translation);
  }

  const output = $.xml().split("\n").slice(1).join("\n");
  fs.writeFileSync(destinationRoute, output);
}

async function translateOnlyChnagesResxFile(route, language) {
  const routeWithoutEnding = route.split(".").slice(0, -1).join(".");
  const destinationRoute = `${routeWithoutEnding}.${language}.resx`;

  const originalXml = fs.readFileSync(route).toString();
  const translatedXml = fs.readFileSync(destinationRoute).toString();

  const $original = cheerio.load(originalXml, {
    xmlMode: true,
  });
  const $translated = cheerio.load(translatedXml, {
    xmlMode: true,
  });

  const originalData = $original("data");
  const translatedData = $translated("data");

  const originalKeys = originalData
    .map((i, x) => $original(x).attr("name"))
    .toArray();
  const translatedKeys = translatedData
    .map((i, x) => $translated(x).attr("name"))
    .toArray();

  //add new to the translated
  for (let original of originalKeys) {
    if (translatedKeys.includes(original)) continue;
    console.log(`adding ${original} to ${language} in ${route}`);
    const originalValue = $original(`data[name="${original}"]`)
      .find("value")
      .text();
    const translation = await translate(originalValue, language);
    $translated("root").append(
      `<data name="${original}"><value>${translation}</value></data>`
    );
  }

  //remove missing from the original
  for (let translated of translatedKeys) {
    if (originalKeys.includes(translated)) continue;
    console.log(`removing ${translated} from ${language} in ${route}`);
    $translated(`data[name="${translated}"]`).remove();
  }

  //write the changes
  const output = $translated.xml().split("\n").slice(1).join("\n");

  fs.writeFileSync(destinationRoute, output);
}

function freshTranslate() {
  for (let route of routes) {
    var files = fs.readdirSync(route);
    for (let file of files) {
      for (let language of languages) {
        if (isCsFile(file) && !isTranslatedFile(file)) {
          createCsFile(`${route}/${file}`, language);
        }
        if (isResxFile(file) && !isTranslatedFile(file)) {
          translateFreshResxFile(`${route}/${file}`, language);
        }
      }
    }
  }
}

function hasTranslatedResxFile(files, originalFile, language) {
  const originalFileWithoutEnding = originalFile
    .split(".")
    .slice(0, -1)
    .join(".");
  const translatedFile = `${originalFileWithoutEnding}.${language}.resx`;
  return files.includes(translatedFile);
}

function modifiedTranslate() {
  for (let route of routes) {
    var files = fs.readdirSync(route);
    for (let file of files) {
      for (let language of languages) {
        if (!isTranslatedFile(file)) {
          if (isCsFile(file)) {
            createCsFile(`${route}/${file}`, language);
          }
          if (isResxFile(file)) {
            if (hasTranslatedResxFile(files, file, language)) {
              translateOnlyChnagesResxFile(`${route}/${file}`, language);
            } else {
              translateFreshResxFile(`${route}/${file}`, language);
            }
          }
        }
      }
    }
  }
}

//google cloud API key goes here
const API_KEY = "";
const routes = ["./Resources"];
const languages = ["lt"];

function validate() {
  if (API_KEY === "") {
    console.log("Please provide API_KEY");
    process.exit(1);
  }
  if (routes.length === 0) {
    console.log("Please provide routes");
    process.exit(1);
  }
  if (languages.length === 0) {
    console.log("Please provide languages");
    process.exit(1);
  }
}

function executeFreshTranslate() {
  validate();
  console.log("Executing fresh translate");
  removeAllPreviouslyTranslatedFiles();
  freshTranslate();
  console.log("Finished fresh translate");
}

function executeModifiedTranslate() {
  validate();
  console.log("Executing modified translate");
  modifiedTranslate();
  console.log("Finished modified translate");
}

// executeFreshTranslate();
executeModifiedTranslate();
