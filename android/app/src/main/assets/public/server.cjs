var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.post("/api/fill-form", async (req, res) => {
    try {
      const { prompt, formType } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is missing." });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let schemaText = "";
      if (formType === "auto") {
        schemaText = `Determine the type of record the user wants to add, and extract the details. If the user mentions a car name, brand, model, or short identifier like 'GKD', 'Onix', 'Cronos', etc., or says 'cadastrar', 'novo carro', classify as type "vehicle" with brand or model set to that name. 
        JSON format: {
          "type": "vehicle" | "fuel" | "maintenance" | "trip" | "expense" | "unknown",
          "data": { 
            // If vehicle: { brand?, model?, plate?, color?, rentalCompany?, startDate?, endDate?, initialKm?, contractNumber?, valorRecebido?, valorSemanal?, financiamento?, seguro?, ipva?, manutencaoPreventiva?, currentKm?, fuelLevel?, driver?, driverPhone?, caucaoValor?, caucaoData?, caucaoObservacoes?, nextVistoriaDate? }
            // If fuel: { fuelDate?, fuelKm?, fuelLiters?, fuelPricePerLiter?, fuelTotalCost?, fuelType?, fuelStation? }
            // If maintenance: { maintDate?, maintType?, maintDescription?, maintCost?, maintShop?, maintNextKm? }
            // If trip: { tripDate?, tripDriver?, tripStartKm?, tripEndKm?, tripPurpose? }
            // If expense: { expDate?, expCategory?, expDescription?, expCost? }
          }
        }`;
      } else if (formType === "vehicle") {
        schemaText = `Extract vehicle details. JSON format: { brand?: string, model?: string, plate?: string, color?: string, rentalCompany?: string, startDate?: string (YYYY-MM-DD), endDate?: string (YYYY-MM-DD), initialKm?: number, contractNumber?: string, valorRecebido?: number, valorSemanal?: number, financiamento?: number, seguro?: number, ipva?: number, manutencaoPreventiva?: number, currentKm?: number, fuelLevel?: number, driver?: string, driverPhone?: string, caucaoValor?: number, caucaoData?: string (YYYY-MM-DD), caucaoObservacoes?: string, nextVistoriaDate?: string (YYYY-MM-DD) }`;
      } else if (formType === "fuel") {
        schemaText = `Extract fuel log details. JSON format: { fuelDate?: string (YYYY-MM-DD), fuelKm?: number, fuelLiters?: number, fuelPricePerLiter?: number, fuelTotalCost?: number, fuelType?: "Gasolina" | "Etanol" | "Diesel" | "Flex", fuelStation?: string }`;
      } else if (formType === "maintenance") {
        schemaText = `Extract maintenance log details. JSON format: { maintDate?: string (YYYY-MM-DD), maintType?: "Revis\xE3o" | "Preventiva" | "Corretiva" | "Pneus" | "Outro", maintDescription?: string, maintCost?: number, maintShop?: string, maintNextKm?: number }`;
      } else if (formType === "trip") {
        schemaText = `Extract trip log details. JSON format: { tripDate?: string (YYYY-MM-DD), tripDriver?: string, tripStartKm?: number, tripEndKm?: number, tripPurpose?: string }`;
      } else if (formType === "expense") {
        schemaText = `Extract expense details. JSON format: { expDate?: string (YYYY-MM-DD), expCategory?: "Lavagem" | "Estacionamento" | "Ped\xE1gio" | "Multa" | "Outros", expDescription?: string, expCost?: number }`;
      } else {
        return res.status(400).json({ error: "Invalid formType" });
      }
      const systemPrompt = `You are a helpful data extraction assistant. Your task is to extract information from the user's input and return it in JSON format based on the following schema requirement. Do not wrap the JSON in markdown code blocks. Just return raw JSON.
      
Schema requirement: ${schemaText}`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });
      let responseText = response.text || "{}";
      responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const extractedData = JSON.parse(responseText);
      res.json({ success: true, data: extractedData });
    } catch (error) {
      console.error("AI Fill Error:", error);
      const errMsg = error.message || "";
      if (errMsg.includes("resource_exhausted") || errMsg.includes("quota") || errMsg.includes("429")) {
        return res.status(429).json({ error: "Limite de cota da IA excedido temporariamente. Por favor, preencha os dados manualmente." });
      }
      res.status(500).json({ error: errMsg || "Failed to process AI request" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
