/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const {JSDOM} = require("jsdom");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 2});


exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});


// URL recipe importer disabled for now.
// Requires deployed backend function because browsers block cross-origin scraping.

exports.importRecipe = onRequest(async (req, res) => {
  try {
    const url = req.body.url;

    if (!url) {
      return res.status(400).json({
        error: "No URL provided",
      });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    console.log("status:", response.status);
    console.log("url:", url);

    if (!response.ok) {
      throw new Error(`Website returned status ${response.status}`);
    }

    const html = await response.text();

    // makes new html doc to search
    const dom = new JSDOM(html);
    const doc = dom.window.document;


    // searches doc for scripts
    const scripts = doc.querySelectorAll(
        "script[type=\"application/ld+json\"]",
    );

    console.log("JSON-LD count:", scripts.length);


    // searches for recipe
    let recipe = null;

    scripts.forEach((script) => {
      try {
        const data = JSON.parse(script.textContent);

        const found = findRecipe(data);

        if (found) {
          recipe = found;
        }
        console.log("Found type:", data["@type"]);
      } catch (e) {
        console.log("Failed to parse JSON-LD:", e);
      }
    });


    if (!recipe) {
      return res.status(404).json({
        error: "No recipe found",
      });
    }

    const normalizedRecipe = normalizeRecipe(recipe);

    res.json(normalizedRecipe);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});


function findRecipe(data) {
  if (!data) return null;

  if (data["@type"] === "Recipe") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.find(findRecipe);
  }

  if (Array.isArray(data["@graph"])) {
    return data["@graph"].find(findRecipe);
  }

  return null;
}

function normalizeRecipe(recipe) {
  return {
    name: recipe.name || "",
    ingredients: normalizeIngredients(recipe.recipeIngredient),
    instructions: normalizeInstructions(recipe.recipeInstructions),
  };
}

function normalizeIngredients(ingredients) {
  if (!ingredients) return [];

  if (typeof ingredients === "string") {
    return [ingredients];
  }

  return ingredients;
}

function normalizeInstructions(instructions) {
  if (!instructions) return [];

  if (typeof instructions === "string") {
    return [instructions];
  }

  if (Array.isArray(instructions)) {
    return instructions.flatMap((step) => {
      if (typeof step === "string") {
        return step;
      }

      if (step.text) {
        return step.text;
      }

      if (step.itemListElement) {
        return step.itemListElement
            .map((item) => item.text)
            .filter(Boolean);
      }

      return [];
    });
  }

  return [];
}
