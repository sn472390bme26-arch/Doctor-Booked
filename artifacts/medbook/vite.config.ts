import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const port = Number(process.env.PORT ?? 5173);
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
base: basePath,

plugins:[
react(),
tailwindcss(),
runtimeErrorOverlay()
],

resolve:{
alias:{
"@":path.resolve(__dirname,"src"),
"@assets":path.resolve(__dirname,"..","..","attached_assets")
},
dedupe:["react","react-dom"]
},

root:path.resolve(__dirname),

build:{
outDir:path.resolve(__dirname,"dist/public"),
emptyOutDir:true
},

server:{
port:port,
host:"0.0.0.0",
allowedHosts:true,

proxy:{
"/api":{
target:"http://localhost:3000",
changeOrigin:true,
secure:false
}
},

fs:{
strict:true,
deny:["**/.*"]
}
},

preview:{
port:port,
host:"0.0.0.0",
allowedHosts:true
}
});
