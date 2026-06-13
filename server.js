import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const distPath = join(__dirname, 'dist');

// Check if dist folder exists
if (!fs.existsSync(distPath)) {
    console.error('❌ Error: "dist" folder not found!');
    console.error('👉 Please run "npm run build" before starting the server.');
    process.exit(1);
}

// Serve static files from the compiled dist directory
app.use(express.static(distPath));

// Handle any client-side routing (fallback to index.html)
app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
});

// Bind to 0.0.0.0 to allow external access when hosting on a server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FocusFlow production server is running!`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`📡 Network: http://0.0.0.0:${PORT}`);
});
