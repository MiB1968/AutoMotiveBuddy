import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors({ origin: '*' }));
  app.use(express.json());

  // Load DTCs from JSON
  let dtcMaster: any[] = [];
  try {
    const dataPath = path.join(process.cwd(), 'data/dtc_master.json');
    if (fs.existsSync(dataPath)) {
      dtcMaster = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
  } catch (e) {
    console.error("Error loading DTC Master:", e);
  }

  // --- SYNC ROUTES ---
  app.post('/api/sync/upload', (req, res) => {
    const logs = req.body.logs || [];
    console.log(`Received ${logs.length} offline logs from client sync`);
    res.json({ status: "received", count: logs.length });
  });

  app.get('/api/sync/download', (req, res) => {
    res.json({
      dtc: [
        {
          code: "P0101",
          description: "Mass Air Flow Sensor Issue (Updated via Sync)",
          system: "Powertrain",
          symptoms: ["Check Engine Light", "Poor fuel economy"],
          solutions: ["Replace MAF"]
        }
      ]
    });
  });

  // --- API ROUTES ---

  // DTC Route (Multi-Layer Logic)
  app.get('/api/dtc/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    
    // 1. Verified Lookups
    const dtc = dtcMaster.find(d => d.code === code);
    if (dtc) {
      return res.json({ 
        ...dtc, 
        symptoms: typeof dtc.causes === 'string' ? dtc.causes.split(',') : (dtc.symptoms || []),
        solutions: typeof dtc.solutions === 'string' ? dtc.solutions.split(',') : (dtc.solutions || []),
        status: "VERIFIED", 
        confidence: 1.0 
      });
    }

    // 2. Generic Fallback
    const genericCodePrefix = code.substring(0, 3);
    const generic = dtcMaster.find(d => d.code.startsWith(genericCodePrefix));
    if (generic) {
      return res.json({
        code: code,
        description: generic.description,
        system: generic.system,
        severity: generic.severity,
        symptoms: [`Related to ${generic.causes}`],
        solutions: [`Related to ${generic.solutions}`],
        manufacturer: "Generic Fallback",
        status: "PARTIAL",
        confidence: 0.6
      });
    }

    // 3. AI Fallback (Mocked response)
    return res.json({
      code: code,
      description: `AI Extrapolated Meaning for ${code}. System likely implies a specialized module fault.`,
      system: "Unknown Module",
      severity: "Requires Attention",
      symptoms: ["Check Engine Light", "Possible performance decrease"],
      solutions: ["Check live telemetry", "Consult OEM repair manual", "Trace circuits to associated sensor"],
      manufacturer: "AI_ESTIMATED",
      status: "AI_ESTIMATED",
      confidence: 0.75
    });
  });

  app.post('/api/ai/diagnose', async (req, res) => {
    const { vehicle, query } = req.body;
    
    // Check if we can use server-side AI
    if (process.env.GEMINI_API_KEY) {
       try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const vStr = `${vehicle?.year || 'Any'} ${vehicle?.make || 'Unknown'} ${vehicle?.model || 'Vehicle'} (${vehicle?.engine || 'Any Engine'})`;
          
          const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: {
              systemInstruction: `You are "AutoMotive Buddy AI", a world-class automotive diagnostics assistant. Your goal is to help users identify engine codes (DTCs), explain symptoms, and suggest solutions. Be professional, technical yet accessible, and always prioritize safety. Owner: Ruben Llego. Greeting: "Hello! I'm your AutoMotive Buddy. How can I help with your vehicle today?" Do not use markdown headers larger than h3.`,
            }
          });
          const response = await chat.sendMessage({ message: `Vehicle: ${vStr}\n\nQuery: ${query}` });
          return res.json({ answer: response.text });
       } catch (err) {
          console.error("AI Error:", err);
       }
    }
    
    const vStr = `${vehicle?.year || 'Any'} ${vehicle?.make || 'Unknown'} ${vehicle?.model || 'Vehicle'} (${vehicle?.engine || 'Any Engine'})`;

    return res.json({
      answer: `[AI Diagnostician for ${vStr}]\n\nProcessing symptom: "${query}".\n\nAI Estimation: Check common failure points for this make and model. If no verified data exists, fallback protocols suggest testing power and ground at the affected sensor.`
    });
  });

  app.post('/api/ai/generate', async (req, res) => {
    const { type, make, modelStr, year, engine } = req.body;
    
    if (process.env.GEMINI_API_KEY) {
       try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          let systemPrompt = "";

          if (type === 'fuses') {
            systemPrompt = `You are a professional automotive electrician. Provide a detailed summary of the main fuse boxes (Engine Bay and Interior/Passenger Compartment), relay locations, and critical fuse diagrams for the ${year} ${make} ${modelStr} (${engine}). Format your response in clean Markdown with tables for the fuse numbers, amp ratings, and descriptions.`;
          } else if (type === 'components') {
            systemPrompt = `You are a master mechanic. Provide a detailed guide on component locations for the ${year} ${make} ${modelStr} (${engine}). Include exact locations for: OBD2 port, battery, main engine computer (ECU/PCM), starter motor, alternator, oxygen sensors, mass airflow sensor, and oil/air/cabin filters. Format your response in clean Markdown.`;
          } else if (type === 'warning_lights') {
            systemPrompt = `You are an expert automotive diagnostician. Provide a detailed guide on the dashboard warning lights for the ${year} ${make} ${modelStr}. Categorize them by severity (Red = Stop ASAP, Yellow = Check soon, Green/Blue = Informational). Describe what each light looks like, what it means, and recommended actions. Format your response in clean Markdown.`;
          }
          
          const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: { systemInstruction: systemPrompt, temperature: 0.3 }
          });
          
          const response = await chat.sendMessage({ message: `I need the ${type} data for a ${year} ${make} ${modelStr} with engine ${engine}.` });
          return res.json({ result: response.text });
       } catch (err) {
          console.error("AI Error:", err);
       }
    }
    
    // Fallback logic
    if (type === 'fuses') {
      return res.json({ result: `### ⚠️ SYSTEM ALERT: USING UNIVERSAL COMPATIBILITY PROTOCOL\n_Applying generic automotive diagnostics for ${year} ${make} ${modelStr}._\n\n#### Engine Bay Fuse Box (Typical Layout)\n| Fuse # | Amperage | Description |\n|---|---|---|\n| F01 | 40A | ABS Pump / Module |\n| F02 | 30A | Starter Relay |\n| F03 | 20A | Engine Control Module (ECM) |\n| F04 | 15A | Ignition Coils / Injectors |`});
    }
    
    if (type === 'components') {
      return res.json({ result: `### ⚠️ SYSTEM ALERT: USING UNIVERSAL COMPATIBILITY PROTOCOL\n_Applying generic component mapping for ${year} ${make} ${modelStr}._\n\n*   **OBD-II Port:** Usually located under the dashboard on the driver's side, near the steering column.\n*   **Battery:** Engine bay, typically covered by a black plastic shroud.\n*   **Engine Control Unit (ECU):** Often located near the battery or air intake box, sometimes mounted on the firewall.`});
    }
    
    if (type === 'warning_lights') {
      return res.json({ result: `### ⚠️ SYSTEM ALERT: USING UNIVERSAL COMPATIBILITY PROTOCOL\n_Displaying universal standardized warning lights guide._\n\n##### 🔴 CRITICAL (STOP AND INVESTIGATE)\n*   **Check Engine Light (Flashing):** Severe engine misfire. Pull over immediately to prevent catalytic converter damage.\n*   **Oil Pressure Warning:** Low oil pressure. Stop the engine immediately to prevent catastrophic internal damage.\n\n##### 🟡 WARNING (CHECK SOON)\n*   **Check Engine Light (Solid):** An emissions or sensor fault. Safe to drive, but needs scanning soon.`});
    }
    
    return res.json({ result: "Unable to retrieve vehicle dataset." });
  });

  // Component Locator Route
  app.post('/api/ai/component-locate', (req, res) => {
    const { query } = req.body;
    return res.json({
      result: `Estimated location for [${query}]: Typically found in the engine bay or under the dashboard. Use an inspection mirror or refer to generic technical manuals for exact pinouts.`
    });
  });

  // Live Telemetry Mock
  app.get('/api/live/all', (req, res) => {
    // Generate some simulated live data
    const rpm = Math.floor(800 + Math.random() * 2000);
    const temp = Math.floor(80 + Math.random() * 25);
    res.json({ rpm: rpm.toString(), temp: temp.toString() });
  });

  // Admin Logs Mock
  app.get('/api/admin/logs', (req, res) => {
    res.json([
      { action: "DTC Search P0101", timestamp: new Date().toISOString() },
      { action: "AI Diagnose Request", timestamp: new Date(Date.now() - 50000).toISOString() },
      { action: "Live Telemetry Connected", timestamp: new Date(Date.now() - 100000).toISOString() }
    ]);
  });

  // Unit Manuals Mock
  app.get('/api/manual', (req, res) => {
    res.json({ content: "### GENERAL SERVICE MANUAL\n\n1. Ensure vehicle is powered off before accessing main electronics.\n2. When servicing the high-voltage system, wear class 0 rubber gloves.\n3. Verify all DTCs using OBD-II scanner before replacing modules." });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on http://localhost:" + PORT);
  });
}

startServer();
